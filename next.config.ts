import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
  transpilePackages: ["@speakielts/contracts"]
};

export default nextConfig;
