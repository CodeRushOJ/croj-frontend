import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ["vue", "vue-router", "vue-i18n", "pinia"],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    monacoEditorPlugin({}),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Modern Sass API configuration
        charset: false,
        api: "modern",
        // Any global variables can be injected here
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.api']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    // Optimize production build for Monaco Editor
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ["monaco-editor/esm/vs/editor/editor.api"],
          "monaco-languages": [
            "monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution",
            "monaco-editor/esm/vs/basic-languages/java/java.contribution",
            "monaco-editor/esm/vs/basic-languages/python/python.contribution",
            "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution",
            "monaco-editor/esm/vs/basic-languages/go/go.contribution",
          ],
        },
      },
    },
  },
});
