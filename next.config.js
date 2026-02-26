/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@modelcontextprotocol/sdk",
    "@modelcontextprotocol/ext-apps",
  ],
};

export default nextConfig;
