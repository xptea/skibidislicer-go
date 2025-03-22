package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

type VideoFile struct {
	Name      string `json:"name"`
	Thumbnail string `json:"thumbnail"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) FetchDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{})
}

func (a *App) GetLatestVideos(directory string) ([]VideoFile, error) {
	var videoFiles []os.FileInfo
	videoExtensions := []string{".mp4", ".mov", ".avi", ".mkv", ".webm"}

	files, err := os.ReadDir(directory)
	if err != nil {
		return nil, err
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
					videoFiles = append(videoFiles, fileInfo)
				}
				break
			}
		}
	}

	// Sort by modification time (newest first)
	sort.Slice(videoFiles, func(i, j int) bool {
		return videoFiles[i].ModTime().After(videoFiles[j].ModTime())
	})

	// Get the latest 3 videos
	var latestVideos []VideoFile
	for i, file := range videoFiles {
		if i >= 3 {
			break
		}

		videoPath := filepath.Join(directory, file.Name())
		thumbnailPath := generateThumbnail(videoPath)

		latestVideos = append(latestVideos, VideoFile{
			Name:      file.Name(),
			Thumbnail: thumbnailPath,
		})
	}

	return latestVideos, nil
}

// generateThumbnail extracts a thumbnail from a video using FFmpeg
func generateThumbnail(videoPath string) string {
	thumbnailDir := "thumbnails"
	os.MkdirAll(thumbnailDir, os.ModePerm)

	thumbnailPath := filepath.Join(thumbnailDir, filepath.Base(videoPath)+".jpg")

	cmd := exec.Command("ffmpeg", "-i", videoPath, "-ss", "00:00:01", "-frames:v", "1", thumbnailPath)
	err := cmd.Run()
	if err != nil {
		fmt.Println("Error generating thumbnail:", err)
		return ""
	}

	return thumbnailPath
}
