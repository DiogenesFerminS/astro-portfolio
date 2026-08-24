// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  env: {
    schema: {
      // Secreto de runtime: NO se inlinea en el bundle, se lee de process.env
      // en la función de Netlify en cada request.
      GITHUB_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },
  vite: {
    plugins: [
      /** @ts-ignore */
      tailwindcss()
    ]
  }
});
