import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// يبحث تلقائيًا عن ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // صورة مؤقتة محلية بصيغة SVG (public/images/placeholder.svg)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // صور Supabase Storage (products, fabrics, order-snapshots)
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
