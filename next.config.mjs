/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.yandex.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.mds.yandex.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.mzstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "is1-ssl.mzstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "is2-ssl.mzstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "is3-ssl.mzstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "is4-ssl.mzstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "is5-ssl.mzstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.dzcdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-images.dzcdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
