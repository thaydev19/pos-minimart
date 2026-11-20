import type { NextConfig } from "next";
import path from "path";

// When building on Vercel, omit output: "export" so Route Handlers & Crons run as Serverless Functions.
// For local static builds (Tauri EXE / Capacitor Android APK), output: "export" generates the static out/ folder.
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "export" }),
  trailingSlash: true,
  outputFileTracingRoot: path.join(process.cwd()),
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
