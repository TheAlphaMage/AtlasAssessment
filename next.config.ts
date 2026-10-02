import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SheetJS is only needed used only by server routes; keep it out of the bundle.
  serverExternalPackages: ["xlsx"],
  reactStrictMode: true,
};

export default nextConfig;
