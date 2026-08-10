import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://pkkmb.bemftunesa.org";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Halaman dashboard memerlukan autentikasi — tidak perlu di-index.
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
