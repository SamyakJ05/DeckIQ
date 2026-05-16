import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent bundling native PDF/canvas modules — load at runtime in Node
  serverExternalPackages: ["pdf-parse", "pdf-parse/worker", "@napi-rs/canvas", "pdfjs-dist"],
};

export default nextConfig;
