import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, 'src/index.ts'),
            output: {
                entryFileNames: 'main.js',
                format: 'iife',
            }
        }
    },
    envPrefix: 'PLUGIN_',
});
