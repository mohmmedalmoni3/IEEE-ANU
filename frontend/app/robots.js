export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
