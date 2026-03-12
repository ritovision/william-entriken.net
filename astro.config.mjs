import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const useFastLinkBuild = process.env.ASTRO_FAST_LINK_BUILD === "1";

export default defineConfig({
  output: "static",
  site: "https://williamentriken.net",
  image: useFastLinkBuild
    ? {
        service: {
          entrypoint: "astro/assets/services/noop",
        },
      }
    : undefined,
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  server: {
    host: true,
    port: 4321,
  },
  preview: {
    host: true,
    port: 4321,
  },
  vite: {
    optimizeDeps: {
      include: ['zod'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: [
            "import",
            "global-builtin",
            "color-functions",
            "legacy-js-api",
          ],
        },
      },
    },
  },
});
