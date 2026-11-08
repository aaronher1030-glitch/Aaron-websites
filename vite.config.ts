import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      // Registration is handled by the in-app update prompt so a reload is
      // never forced in the middle of a drill.
      injectRegister: null,
      includeAssets: ["favicon.svg", "icon.svg", "offline.html"],
      manifest: {
        name: "ChemBank — PNCO Reviewer",
        short_name: "ChemBank",
        description:
          "Free, independent PNCO/ACho chemistry reviewer with verified questions and worked solutions.",
        theme_color: "#1f3a8a",
        background_color: "#f4f1e8",
        display: "standalone",
        start_url: "/",
        scope: "/",
        categories: ["education", "productivity"],
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "chembank-pages",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  build: { target: "es2022" },
});
