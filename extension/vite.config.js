import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Custom plugin to copy extension-specific files after build
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const files = ['manifest.json', 'content.js', 'background.js'];
      files.forEach(f => {
        const src = resolve(__dirname, 'public', f);
        const dest = resolve(__dirname, 'dist', f);
        if (existsSync(src)) copyFileSync(src, dest);
      });
      // Copy icons directory
      const iconsDir = resolve(__dirname, 'public', 'icons');
      const destIconsDir = resolve(__dirname, 'dist', 'icons');
      if (existsSync(iconsDir)) {
        if (!existsSync(destIconsDir)) mkdirSync(destIconsDir, { recursive: true });
        const { readdirSync } = require('fs');
        readdirSync(iconsDir).forEach(file => {
          copyFileSync(resolve(iconsDir, file), resolve(destIconsDir, file));
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // No code splitting — extension needs single files
    cssCodeSplit: false,
  },
  // Required for extension iframe to work with chrome-extension:// protocol
  base: './',
});
