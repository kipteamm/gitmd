import { defineConfig } from "vite";
import { resolve } from "node:path";


export default defineConfig({
    base: "/static/",
    build: {
        outDir: "static/dist",
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: resolve(import.meta.dirname, "src/ts/index.ts"),
            output: {
                entryFileNames: "bundle.js",
                chunkFileNames: "[name].js",
                assetFileNames: "bundle.[ext]",
                
                manualChunks(id: string) {
                    if (!id.includes("node_modules"))
                        return;

                    if (id.includes("@codemirror") || id.includes("codemirror") || id.includes("@lezer"))
                        return "codemirror-vendor";

                    return "vendor";
                }
            }
        }
    }
});

