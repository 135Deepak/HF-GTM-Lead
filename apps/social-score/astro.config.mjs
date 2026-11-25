// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  server: {
    port: 4322
  },
  integrations: [react()],
  adapter: cloudflare()
});
