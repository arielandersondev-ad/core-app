import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/consultations",
        destination: "/treatments/consultations",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
