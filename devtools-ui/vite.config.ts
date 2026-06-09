import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	root: "devtools-ui",
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	build: {
		emptyOutDir: true,
		outDir: "../dist/devtools-ui",
	},
	server: {
		proxy: {
			"/__devtools": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
		},
	},
});
