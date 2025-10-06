/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',

  // Configuração de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Webpack config para USB (node-usb)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'usb']
    }
    return config
  },
}

module.exports = nextConfig
