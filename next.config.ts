import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@whiskeysockets/baileys"],
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
