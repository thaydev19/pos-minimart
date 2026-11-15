import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  outputFileTracingRoot: path.join(process.cwd()),
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
