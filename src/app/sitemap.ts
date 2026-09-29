import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sohenpatel.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    ...projects.map((p) => ({ url: `${SITE}/projects/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
