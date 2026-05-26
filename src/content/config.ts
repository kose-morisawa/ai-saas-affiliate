import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().max(60),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
    asp_links: z
      .array(
        z.object({
          placeholder: z.string(),
          name: z.string(),
        })
      )
      .optional(),
  }),
});

export const collections = { blog };
