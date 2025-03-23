package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx            context.Context
	thumbnailCache map[string][]byte
	mutex          sync.RWMutex
}

type VideoFile struct {
	Name string `json:"name"`
	ID   string `json:"id"`
	Path string `json:"path"`
}

type Settings struct {
	WatchLocation string `json:"watch_location"`
	SaveLocation  string `json:"save_location"`
}

func NewApp() *App {
	app := &App{
		thumbnailCache: make(map[string][]byte),
	}

	http.HandleFunc("/thumbnails/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/thumbnails/")
		app.mutex.RLock()
		data, exists := app.thumbnailCache[id]
		app.mutex.RUnlock()

		if !exists {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "image/jpeg")
		w.Write(data)
	})

	http.HandleFunc("/video/", func(w http.ResponseWriter, r *http.Request) {
		filePath := strings.TrimPrefix(r.URL.Path, "/video/")
		filePath, err := url.QueryUnescape(filePath)
		if err != nil {
			http.Error(w, "Invalid file path", http.StatusBadRequest)
			return
		}

		file, err := os.Open(filePath)
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}
		defer file.Close()

		stat, err := file.Stat()
		if err != nil {
			http.Error(w, "Error reading file", http.StatusInternalServerError)
			return
		}

		http.ServeContent(w, r, stat.Name(), stat.ModTime(), file)
	})

	go http.ListenAndServe("localhost:34115", nil)
	return app
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) domReady(ctx context.Context) {
}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

func (a *App) shutdown(ctx context.Context) {
}

func (a *App) FetchDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{})
}

func (a *App) SelectVideo() (string, error) {
	filepath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Video File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Video Files",
				Pattern:     "*.mp4;*.mov;*.avi;*.mkv;*.webm",
			},
		},
	})

	if err != nil {
		return "", fmt.Errorf("error selecting video: %w", err)
	}

	if _, err := os.Stat(filepath); err != nil {
		return "", fmt.Errorf("selected file is not accessible: %w", err)
	}

	return filepath, nil
}

func (a *App) GetLatestVideos(directory string) ([]VideoFile, error) {
	if directory == "" {
		return nil, fmt.Errorf("directory path is empty")
	}

	var videoFiles []os.FileInfo
	videoExtensions := []string{".mp4", ".mov", ".avi", ".mkv", ".webm"}

	files, err := os.ReadDir(directory)
	if err != nil {
		return nil, fmt.Errorf("error reading directory: %w", err)
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(file.Name()))
		for _, vidExt := range videoExtensions {
			if ext == vidExt {
				fileInfo, err := file.Info()
				if err == nil {
					fullPath := filepath.Join(directory, file.Name())
					if _, err := os.Stat(fullPath); err == nil {
						videoFiles = append(videoFiles, fileInfo)
					}
				}
				break
			}
		}
	}

	sort.Slice(videoFiles, func(i, j int) bool {
		return videoFiles[i].ModTime().After(videoFiles[j].ModTime())
	})

	var latestVideos []VideoFile
	for i, file := range videoFiles {
		if i >= 3 {
			break
		}

		videoPath := filepath.Join(directory, file.Name())
		id := fmt.Sprintf("%s_%d", file.Name(), file.ModTime().UnixNano())

		thumbnailData, err := a.generateThumbnail(videoPath)
		if err == nil {
			a.mutex.Lock()
			a.thumbnailCache[id] = thumbnailData
			a.mutex.Unlock()
		}

		latestVideos = append(latestVideos, VideoFile{
			Name: file.Name(),
			ID:   id,
			Path: videoPath,
		})
	}

	return latestVideos, nil
}

func (a *App) generateAndCacheThumbnail(videoPath, id string) {
	thumbnailData, err := a.generateThumbnail(videoPath)
	if err != nil {
		return
	}

	a.mutex.Lock()
	a.thumbnailCache[id] = thumbnailData
	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "thumbnail-ready", id)
}

func (a *App) GetThumbnail(id string) []byte {
	a.mutex.RLock()
	defer a.mutex.RUnlock()
	return a.thumbnailCache[id]
}

func (a *App) generateThumbnail(videoPath string) ([]byte, error) {
	tempDir, err := os.MkdirTemp("", "thumbnails")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)

	thumbnailPath := filepath.Join(tempDir, "thumbnail.jpg")

	cmd := exec.Command("ffmpeg", "-i", videoPath,
		"-ss", "00:00:01",
		"-vframes", "1",
		"-vf", "scale=320:-1",
		"-q:v", "2",
		thumbnailPath)

	if err := cmd.Run(); err != nil {
		return nil, err
	}

	return os.ReadFile(thumbnailPath)
}

func getSettingsFilePath() (string, error) {
	appDataDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	settingsDir := filepath.Join(appDataDir, "skibidislicer", "settings")
	if err := os.MkdirAll(settingsDir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(settingsDir, "settings.json"), nil
}

func (a *App) SaveWatchLocation(location string) error {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		return err
	}

	var settings Settings
	data, err := os.ReadFile(settingsFilePath)
	if err == nil {
		json.Unmarshal(data, &settings)
	}

	settings.WatchLocation = location
	data, err = json.Marshal(settings)
	if err != nil {
		return err
	}

	return os.WriteFile(settingsFilePath, data, 0644)
}

func (a *App) GetWatchLocation() (string, error) {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		return "", err
	}

	data, err := os.ReadFile(settingsFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}

	var settings Settings
	if err := json.Unmarshal(data, &settings); err != nil {
		return "", err
	}

	return settings.WatchLocation, nil
}

func (a *App) SaveSaveLocation(location string) error {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		return err
	}

	var settings Settings
	data, err := os.ReadFile(settingsFilePath)
	if err == nil {
		json.Unmarshal(data, &settings)
	}

	settings.SaveLocation = location
	data, err = json.Marshal(settings)
	if err != nil {
		return err
	}

	return os.WriteFile(settingsFilePath, data, 0644)
}

func (a *App) GetSaveLocation() (string, error) {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		return "", err
	}

	data, err := os.ReadFile(settingsFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}

	var settings Settings
	if err := json.Unmarshal(data, &settings); err != nil {
		return "", err
	}

	return settings.SaveLocation, nil
}

func (a *App) ExportClip(videoPath string, title string, startTime float64, endTime float64) (string, error) {
	saveLocation, err := a.GetSaveLocation()
	if err != nil || saveLocation == "" {
		userDir, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("error getting user home directory: %w", err)
		}
		saveLocation = filepath.Join(userDir, "Videos")
	}

	if err := os.MkdirAll(saveLocation, 0755); err != nil {
		return "", fmt.Errorf("error creating save directory: %w", err)
	}

	if title == "" {
		baseName := filepath.Base(videoPath)
		title = strings.TrimSuffix(baseName, filepath.Ext(baseName)) + "_clip"
	}

	outputPath := filepath.Join(saveLocation, title+".mp4")

	startTimeStr := fmt.Sprintf("%.2f", startTime)
	duration := endTime - startTime
	durationStr := fmt.Sprintf("%.2f", duration)

	cmd := exec.Command(
		"ffmpeg",
		"-i", videoPath,
		"-ss", startTimeStr,
		"-t", durationStr,
		"-c:v", "libx264",
		"-preset", "medium",
		"-c:a", "aac",
		"-b:a", "128k",
		"-y",
		outputPath,
	)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("error running ffmpeg: %w", err)
	}

	return outputPath, nil
}
