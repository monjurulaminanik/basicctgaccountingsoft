import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets CI or a locked Windows workspace use an isolated Next build cache.
  // Normal deployments continue to use the default `.next` directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Serial generation avoids transient Windows file locks in constrained builds.
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 100,
  },
};

export default nextConfig;
