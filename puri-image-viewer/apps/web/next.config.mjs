import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    cleanDistDir: true,
    sassOptions: {
        includePaths: [path.join(new URL('.', import.meta.url).pathname, 'src/styles')],
    },
    compiler: {
        styledComponents: true,
    },
};

export default nextConfig;
