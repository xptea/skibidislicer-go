package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:            "SkibidiSlicer",
		Width:            800,
		Height:           710,
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Frameless:     true,
		DisableResize: true,
		MinWidth:      800,
		MinHeight:     600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
