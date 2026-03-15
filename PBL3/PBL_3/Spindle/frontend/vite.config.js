import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Spindle",
        short_name: "spindle",
        theme_color: "#ef1628",
        background_color: "#010407",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "maskicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },

          {
            src: "spindle192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "spindle256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "spindle384.png",
            sizes: "384x384",
            type: "image/png",
          },

          {
            src: "spindle512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
