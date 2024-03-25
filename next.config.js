/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createNextIntlPlugin from "next-intl/plugin";

await import("./src/env.js");

const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["pino"],
    forceSwcTransforms: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
  output: "standalone",
  reactStrictMode: false,
  webpack: (config, options) => {
    config.externals.push({ "thread-stream": "commonjs thread-stream" });
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    return config;
  },
};

export default withNextIntl(config);
