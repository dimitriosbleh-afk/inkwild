import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { defineConfig, type Plugin } from 'vitest/config';

/** Writes sw.js with every built file precached, so the game works offline after the very first visit. */
function serviceWorker(): Plugin {
  return {
    name: 'inkwild-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = ['./', ...Object.keys(bundle).map((f) => `./${f}`), './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
      const template = readFileSync(new URL('./build/sw.js', import.meta.url), 'utf8');
      const version = createHash('sha256').update(files.join() + template).digest('hex').slice(0, 10);
      const source = template
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [serviceWorker()],
  build: { target: 'safari16', outDir: 'dist' },
  test: { include: ['tests/**/*.test.ts'] },
});
