/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NEXT_PUBLIC_API_URL wordt automatisch door Next ingelezen bij de build.
  // - lokaal (niet gezet): fallback naar http://localhost:4000
  // - productie: zet op "" zodat de frontend same-origin /api aanroept
  //   (de reverse proxy stuurt /api door naar de API-container).
};

module.exports = nextConfig;
