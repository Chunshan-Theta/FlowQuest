import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  
  // 在生產環境構建時禁用 ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 禁用 TypeScript 錯誤檢查在構建時（只在生產環境）
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // 排除測試檔案
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
      loader: 'ignore-loader'
    });
    return config;
  },
  
  // 在生產環境中排除測試檔案
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'].map(ext => {
    if (process.env.NODE_ENV === 'production') {
      return ext;
    }
    return ext;
  }),
};

export default nextConfig;
