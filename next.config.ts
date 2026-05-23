import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: [
    "@tailwindcss/oxide",
    "@tailwindcss/oxide-linux-x64-gnu",
    "@tailwindcss/oxide-linux-x64-musl",
    "@tailwindcss/oxide-windows-x64-msvc",
    "@tailwindcss/oxide-darwin-x64",
    "@tailwindcss/oxide-darwin-arm64"
  ],
};

export default nextConfig;
