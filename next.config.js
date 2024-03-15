/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

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

export default config;
