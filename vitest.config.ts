import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
// @ts-ignore
import tsconfigPaths from 'vitest-tsconfig-paths';

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
    },
});
