import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SheetJS is only needed used only by server routes; keep it out of the bundle.
  serverExternalPackages: ["xlsx"],
  reactStrictMode: true,
  // The API routes read the workbook from disk. Serverless hosts (e.g. Vercel) only ship files that the
  // build traces from imports, so the .xlsx must be listed here or it is missing at runtime.
  outputFileTracingIncludes: {
    "/api/*": ["./Atlas_Fresh_Production_Commercial_Data.xlsx"],
  },
};

export default nextConfig;
