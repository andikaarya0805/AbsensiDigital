import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - allowedDevOrigins is supported in recent Next.js versions but may not be in types yet
  allowedDevOrigins: ["192.168.1.5", "localhost:3000"],
};

export default nextConfig;
