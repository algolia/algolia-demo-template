const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'arcaplanet.vteximg.com.br',
      },
      {
        protocol: 'http',
        hostname: 'arcaplanet.vteximg.com.br',
      },
      {
        protocol: 'https',
        hostname: 'www.hsnstore.com',
      },
      {
        protocol: 'https',
        hostname: 'arcaplanet.vtexassets.com',
      },
    ],
  },
};

export default nextConfig;
