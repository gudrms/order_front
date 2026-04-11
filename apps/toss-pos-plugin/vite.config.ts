import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyDirBeforeWrite: true,
    },
    envPrefix: 'PLUGIN_',
});
