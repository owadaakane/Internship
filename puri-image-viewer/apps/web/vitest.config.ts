import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig, UserConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()] as UserConfig['plugins'],
    test: {
        environment: 'jsdom',
        reporters: 'default',
        alias: {
            '@web': path.resolve(__dirname, './src/'),
        },
        root: './src/test',
        watch: false,
        env: {
            HOST_URL: 'https://localhost:3000',
            NEXT_PUBLIC_API_BASE_URL: 'https://execute-api.example.com/v1',
        },
    },
});
