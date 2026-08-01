import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/admin": "http://admin:8788",
      "/api": "http://worker:8787"
    }
  },
  build: {
    sourcemap: true
  }
});
