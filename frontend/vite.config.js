import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev-time convenience: lets `npm run dev` hit the gateway without CORS
      // juggling. In production, nginx does this same job (see nginx.conf).
      "/api": {
        target: process.env.VITE_GATEWAY_URL || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
