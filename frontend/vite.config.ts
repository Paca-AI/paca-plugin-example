import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "com_paca_example",
      filename: "remoteEntry.js",
      exposes: {
        "./HelloGeneralSection": "./src/HelloGeneralSection.tsx",
        "./HelloProjectSection": "./src/HelloProjectSection.tsx",
        "./HelloTaskSection": "./src/HelloTaskSection.tsx",
        "./HelloProjectSettingsTab": "./src/HelloProjectSettingsTab.tsx",
        "./HelloView": "./src/HelloView.tsx"
      },
      shared: {
        react: { requiredVersion: "^19.0.0" },
        "react-dom": { requiredVersion: "^19.0.0" },
        "@tanstack/react-query": { requiredVersion: "^5.0.0" }
      }
    })
  ],
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false
  }
});
