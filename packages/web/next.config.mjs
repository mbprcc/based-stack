// next.config.ts

import { initOpenNextCloudflareForDev, defineCloudflareConfig } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */

const nextConfig = {
    /* config options here */
    reactStrictMode: true,
    transpilePackages: ["@based/shared"],
    images: {
        domains: ["images.unsplash.com"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
    env: {},
};

// OpenNext.js Cloudflare optimizations
export default defineCloudflareConfig({
    ...nextConfig,
    cloudflare: {
        // Enable cache interception for better ISR/SSG performance
        enableCacheInterception: true,
        // Optimize route preloading behavior
        routePreloadingBehavior: "none", // Reduces CPU usage on cold starts
    },
});

export default nextConfig;
