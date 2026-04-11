import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    envPrefix: 'PLUGIN_',
});
