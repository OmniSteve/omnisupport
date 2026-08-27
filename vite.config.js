import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Standalone Vite configuration.
//
// The app shell imports auth from "@/lib/AuthContext"; we alias that specifier
// to the standalone auth context (src/context/AuthContext.jsx). The "@"
// alias mirrors jsconfig.json for all other src imports.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@/lib/AuthContext",
        replacement: fileURLToPath(new URL("./src/context/AuthContext.jsx", import.meta.url)),
      },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
});