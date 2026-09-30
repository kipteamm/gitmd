import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    base: "/app/static/dist/",
    build: {
        outDir: "static/dist",
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: resolve(import.meta.dirname, "frontend/ts/index.ts"),
            output: {
                entryFileNames: "bundle.js",
                chunkFileNames: "[name].js",
                assetFileNames: (assetInfo) => {
                    if (assetInfo.names?.some((name) => name.endsWith(".css"))) {
                        return "bundle.[ext]";
                    }
                    return "assets/[name]-[hash].[ext]";
                },
                manualChunks(id: string) {
                    if (!id.includes("node_modules")) return;

                    if (id.includes("@codemirror") || id.includes("codemirror") || id.includes("@lezer")) {
                        return "codemirror-vendor";
                    }

                    return "vendor";
                }
            }
        }
    }
});
