import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@tailwindcss/oxide", "@tailwindcss/oxide-linux-x64-gnu"],
};

export default nextConfig;
