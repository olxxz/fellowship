import type { NextConfig } from "next";

const config: NextConfig = {
  // Os pacotes do monorepo são publicados como código-fonte TypeScript + Sass.
  transpilePackages: ["@fellowship/ui", "@fellowship/core"],
};

export default config;
