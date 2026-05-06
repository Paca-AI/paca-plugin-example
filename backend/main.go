//go:build wasip1

package main

import plugin "github.com/Paca-AI/plugin-sdk"

func init() {
	plugin.Run(&examplePlugin{})
}

func main() {}
