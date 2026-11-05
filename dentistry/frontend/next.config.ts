import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@app/ui"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  allowedDevOrigins: ["uncriticisable-imogene-summerly.ngrok-free.dev"],
};

export default nextConfig;
