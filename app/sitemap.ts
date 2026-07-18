import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://vaultkit.io",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://vaultkit.io/readiness",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://vaultkit.io/readiness/r",
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 0.1,
    },
  ]
}
