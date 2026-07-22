/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NEXT_PUBLIC_API_URL wordt automatisch door Next ingelezen bij de build.
  // - lokaal (niet gezet): fallback naar http://localhost:4000
  // - productie: zet op "" zodat de frontend same-origin /api aanroept.
  //
  // Op platforms met gescheiden services (bv. Render) staat de API op een
  // andere URL. Zet dan API_INTERNAL_URL: deze proxy stuurt /api daarheen,
  // zodat de browser same-origin blijft (geen CORS, geen URL in de build).
  async rewrites() {
    let api = process.env.API_INTERNAL_URL;
    if (!api) return [];
    if (!/^https?:\/\//.test(api)) api = `https://${api}`;
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
};

module.exports = nextConfig;
