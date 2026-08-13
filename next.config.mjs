/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ["genlayer-js", "@rainbow-me/rainbowkit", "three", "@react-three/fiber", "@react-three/drei"],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    return config;
  },
};
export default nextConfig;
