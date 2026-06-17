import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/", 
        "/collect/" // We don't want random Google searches finding specific student questionnaires
      ],
    },
    sitemap: "https://www.etomu.com/sitemap.xml",
  };
}
