/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
    // Source photos are 800px wide, so never generate anything larger than 1200px
    // (the default list goes up to 3840px, which wasted bandwidth on wide screens).
    deviceSizes: [384, 640, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256],
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
