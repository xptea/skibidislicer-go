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
	stdruntime "runtime"
	"sort"
	"strings"
	"sync"
	"syscall"
	"unsafe"

	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx            context.Context
	thumbnailCache map[string][]byte
	mutex          sync.RWMutex
	watcher        *fsnotify.Watcher
	watchMutex     sync.Mutex
}

type VideoFile struct {
	Name string `json:"name"`
	ID   string `json:"id"`
	Path string `json:"path"`
}

type Settings struct {
	WatchLocation   string `json:"watch_location"`
	SaveLocation    string `json:"save_location"`
	FileExtension   string `json:"file_extension"`
	Resolution      string `json:"resolution"`
	Codec           string `json:"codec"`
	Bitrate         string `json:"bitrate"`
	CopyToClipboard bool   `json:"copy_to_clipboard"`
}

type POINT struct {
	X int32
	Y int32
}

type DROPFILES struct {
	pFiles uint32
	pt     POINT
	fNC    uint32
	fWide  uint32
}

var (
	user32               = syscall.NewLazyDLL("user32.dll")
	kernel32             = syscall.NewLazyDLL("kernel32.dll")
	procOpenClipboard    = user32.NewProc("OpenClipboard")
	procCloseClipboard   = user32.NewProc("CloseClipboard")
	procEmptyClipboard   = user32.NewProc("EmptyClipboard")
	procSetClipboardData = user32.NewProc("SetClipboardData")
	procGlobalAlloc      = kernel32.NewProc("GlobalAlloc")
	procGlobalFree       = kernel32.NewProc("GlobalFree")
	procGlobalLock       = kernel32.NewProc("GlobalLock")
	procGlobalUnlock     = kernel32.NewProc("GlobalUnlock")
)

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
		w.Header().Set("Access-Control-Allow-Origin", "*")
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
		w.Header().Set("Access-Control-Allow-Origin", "*")
		http.ServeContent(w, r, stat.Name(), stat.ModTime(), file)
	})
	go http.ListenAndServe("localhost:34115", nil)
	return app
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) domReady(ctx context.Context) {}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

func (a *App) shutdown(ctx context.Context) {
	a.watchMutex.Lock()
	defer a.watchMutex.Unlock()
	if a.watcher != nil {
		a.watcher.Close()
	}
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
	if len(videoFiles) > 3 {
		videoFiles = videoFiles[:3]
	}
	var latestVideos []VideoFile
	for _, file := range videoFiles {
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

func (a *App) watchDirectory(path string) {
	a.watcher.Add(path)
	for {
		select {
		case event, ok := <-a.watcher.Events:
			if !ok {
				return
			}
			switch {
			case event.Op&fsnotify.Create == fsnotify.Create:
				runtime.EventsEmit(a.ctx, "file-created")
			case event.Op&fsnotify.Remove == fsnotify.Remove:
				runtime.EventsEmit(a.ctx, "file-removed")
			case event.Op&fsnotify.Rename == fsnotify.Rename:
				runtime.EventsEmit(a.ctx, "file-renamed")
			case event.Op&fsnotify.Write == fsnotify.Write:
				runtime.EventsEmit(a.ctx, "file-changed")
			}
		case err, ok := <-a.watcher.Errors:
			if !ok {
				return
			}
			fmt.Println("Watcher error:", err)
		}
	}
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

	a.watchMutex.Lock()
	defer a.watchMutex.Unlock()
	if a.watcher != nil {
		a.watcher.Close()
	}

	watcher, err := fsnotify.NewWatcher()
	if err == nil {
		a.watcher = watcher
		go a.watchDirectory(location)
	}

	return os.WriteFile(settingsFilePath, data, 0644)
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

	if stdruntime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000,
		}
	}

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

func (a *App) SaveExportSettings(settings map[string]interface{}) error {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		return err
	}
	var currentSettings Settings
	data, err := os.ReadFile(settingsFilePath)
	if err == nil {
		json.Unmarshal(data, &currentSettings)
	}
	if val, ok := settings["file_extension"].(string); ok {
		currentSettings.FileExtension = val
	}
	if val, ok := settings["resolution"].(string); ok {
		currentSettings.Resolution = val
	}
	if val, ok := settings["codec"].(string); ok {
		currentSettings.Codec = val
	}
	if val, ok := settings["bitrate"].(string); ok {
		currentSettings.Bitrate = val
	}
	if val, ok := settings["copy_to_clipboard"].(bool); ok {
		currentSettings.CopyToClipboard = val
	}
	if val, ok := settings["watch_location"].(string); ok {
		currentSettings.WatchLocation = val
	}
	if val, ok := settings["save_location"].(string); ok {
		currentSettings.SaveLocation = val
	}
	data, err = json.Marshal(currentSettings)
	if err != nil {
		return err
	}
	return os.WriteFile(settingsFilePath, data, 0644)
}

func (a *App) GetExportSettings() (Settings, error) {
	settingsFilePath, err := getSettingsFilePath()
	if err != nil {
		return Settings{}, err
	}
	data, err := os.ReadFile(settingsFilePath)
	if err != nil {
		if os.IsNotExist(err) {
			return Settings{
				FileExtension:   "mp4",
				Resolution:      "source",
				Codec:           "default",
				Bitrate:         "",
				CopyToClipboard: false,
			}, nil
		}
		return Settings{}, err
	}
	var settings Settings
	if err := json.Unmarshal(data, &settings); err != nil {
		return Settings{}, err
	}
	if settings.FileExtension == "" {
		settings.FileExtension = "mp4"
	}
	if settings.Resolution == "" {
		settings.Resolution = "source"
	}
	if settings.Codec == "" {
		settings.Codec = "default"
	}
	return settings, nil
}

func (a *App) ExportClip(videoPath, title string, startTime, endTime float64, fileExtension, resolution, codec, bitrate string) (string, error) {
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
	if fileExtension == "" {
		fileExtension = "mp4"
	}
	outputPath := filepath.Join(saveLocation, title+"."+fileExtension)
	isMuted := false
	if strings.HasSuffix(codec, ":muted") {
		isMuted = true
		codec = strings.TrimSuffix(codec, ":muted")
	}
	args := []string{
		"-i", videoPath,
		"-ss", fmt.Sprintf("%.2f", startTime),
		"-t", fmt.Sprintf("%.2f", endTime-startTime),
	}
	if resolution != "" && resolution != "source" {
		switch resolution {
		case "1080p":
			args = append(args, "-vf", "scale=-1:1080")
		case "720p":
			args = append(args, "-vf", "scale=-1:720")
		case "480p":
			args = append(args, "-vf", "scale=-1:480")
		}
	}
	if codec != "" && codec != "default" {
		switch codec {
		case "h264_nvenc":
			args = append(args, "-c:v", "h264_nvenc", "-preset", "p4")
		case "hevc_nvenc":
			args = append(args, "-c:v", "hevc_nvenc", "-preset", "p4")
		case "libx264":
			args = append(args, "-c:v", "libx264", "-preset", "medium")
		case "libx265":
			args = append(args, "-c:v", "libx265", "-preset", "medium")
		default:
			args = append(args, "-c:v", "libx264", "-preset", "medium")
		}
	} else {
		args = append(args, "-c:v", "libx264", "-preset", "medium")
	}
	if bitrate != "" {
		args = append(args, "-b:v", bitrate+"k")
	}
	if fileExtension != "gif" {
		if isMuted {
			args = append(args, "-an")
		} else {
			args = append(args, "-c:a", "aac", "-b:a", "128k")
		}
	} else {
		args = append(args, "-an")
	}
	if fileExtension == "gif" {
		args = append(args, "-loop", "0")
	}
	args = append(args, "-y", outputPath)
	cmd := exec.Command("ffmpeg", args...)
	if stdruntime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000,
		}
	}

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("error running ffmpeg: %w", err)
	}
	settings, err := a.GetExportSettings()
	if err == nil && settings.CopyToClipboard {
		err = a.CopyToClipboard(outputPath)
		if err != nil {
			fmt.Printf("Failed to copy to clipboard: %v\n", err)
		}
	}
	return outputPath, nil
}

func (a *App) CopyToClipboard(filePath string) error {
	if stdruntime.GOOS != "windows" {
		return runtime.ClipboardSetText(a.ctx, filePath)
	}
	if _, err := os.Stat(filePath); err != nil {
		return fmt.Errorf("file does not exist: %w", err)
	}
	r1, _, err := procOpenClipboard.Call(0)
	if r1 == 0 {
		return fmt.Errorf("failed to open clipboard: %v", err)
	}
	defer procCloseClipboard.Call()
	r1, _, err = procEmptyClipboard.Call()
	if r1 == 0 {
		return fmt.Errorf("failed to empty clipboard: %v", err)
	}
	dropFiles := DROPFILES{
		pFiles: uint32(unsafe.Sizeof(DROPFILES{})),
		pt:     POINT{X: 0, Y: 0},
		fNC:    0,
		fWide:  1,
	}
	dropFilesBytes := (*[unsafe.Sizeof(DROPFILES{})]byte)(unsafe.Pointer(&dropFiles))[:]
	filePathW, err := syscall.UTF16FromString(filePath)
	if err != nil {
		return fmt.Errorf("failed to convert file path to UTF16: %w", err)
	}
	totalBytes := len(dropFilesBytes) + len(filePathW)*2 + 2
	hMem, _, err := procGlobalAlloc.Call(0x0042, uintptr(totalBytes))
	if hMem == 0 {
		return fmt.Errorf("failed to allocate global memory: %v", err)
	}
	ptr, _, err := procGlobalLock.Call(hMem)
	if ptr == 0 {
		procGlobalFree.Call(hMem)
		return fmt.Errorf("failed to lock global memory: %v", err)
	}
	mem := unsafe.Slice((*byte)(unsafe.Pointer(ptr)), totalBytes)
	copy(mem[:len(dropFilesBytes)], dropFilesBytes)
	dest := ptr + uintptr(len(dropFilesBytes))
	for i, w := range filePathW {
		*(*uint16)(unsafe.Pointer(dest + uintptr(i*2))) = w
	}
	index := len(dropFilesBytes) + len(filePathW)*2
	mem[index] = 0
	mem[index+1] = 0
	procGlobalUnlock.Call(hMem)
	r1, _, err = procSetClipboardData.Call(15, hMem)
	if r1 == 0 {
		procGlobalFree.Call(hMem)
		return fmt.Errorf("failed to set clipboard data: %v", err)
	}
	return nil
}

func (a *App) CropVideo(videoPath string, x, y, width, height int) (string, error) {
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
	baseName := filepath.Base(videoPath)
	title := strings.TrimSuffix(baseName, filepath.Ext(baseName)) + "_cropped"
	outputPath := filepath.Join(saveLocation, title+filepath.Ext(videoPath))
	args := []string{
		"-i", videoPath,
		"-vf", fmt.Sprintf("crop=%d:%d:%d:%d", width, height, x, y),
		"-c:a", "copy",
		"-y", outputPath,
	}
	cmd := exec.Command("ffmpeg", args...)
	if stdruntime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000,
		}
	}

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("error running ffmpeg crop: %w", err)
	}
	return outputPath, nil
}

func (a *App) HandleFileUpload(fileData []byte, filename string) (string, error) {
	tempDir := filepath.Join(os.TempDir(), "skibidislicer")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return "", err
	}

	tempFile := filepath.Join(tempDir, filename)
	if err := os.WriteFile(tempFile, fileData, 0644); err != nil {
		return "", err
	}

	return tempFile, nil
}
