export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const routes = ["", "/about", "/laws", "/creators", "/applications", "/store", "/login"];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date()
  }));
}
