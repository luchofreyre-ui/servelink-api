import { z } from "zod";

export const encyclopediaCategorySchema = z.enum([
  "problems",
  "surfaces",
  "methods",
  "chemicals",
  "tools",
  "rooms",
  "prevention",
  "edge-cases",
  "decisions",
]);

export const encyclopediaRoleSchema = z.enum([
  "core",
  "surface-variant",
  "severity-variant",
  "intent-variant",
  "supporting",
]);

export const encyclopediaIndexStatusSchema = z.enum([
  "planned",
  "draft",
  "published",
  "archived",
]);

export const encyclopediaIndexEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: encyclopediaCategorySchema,
  cluster: z.string().min(1),
  role: encyclopediaRoleSchema,
  slug: z.string().min(1),
  status: encyclopediaIndexStatusSchema,
});

export const encyclopediaBatchPageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: encyclopediaCategorySchema,
  cluster: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  image: z.object({
    primaryAlt: z.string().min(1),
    queries: z.array(z.string().min(1)).min(1),
  }),
  sections: z.object({
    what_this_is: z.string().min(1),
    why_it_happens: z.string().min(1),
    what_people_do_wrong: z.string().min(1),
    professional_method: z.string().min(1),
    data_and_benchmarks: z.string().min(1),
    professional_insights: z.string().min(1),
    when_to_call_a_professional: z.string().min(1),
    related_topics: z.array(z.string().min(1)),
  }),
});

export const encyclopediaBatchFileSchema = z.object({
  pages: z.array(encyclopediaBatchPageSchema).min(1),
});

export const encyclopediaFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: encyclopediaCategorySchema,
  cluster: z.string().min(1),
  role: encyclopediaRoleSchema,
  slug: z.string().min(1),
  summary: z.string().min(1),
  status: encyclopediaIndexStatusSchema,
  primaryImageAlt: z.string().min(1),
  imageQueries: z.array(z.string().min(1)),
  relatedTopics: z.array(z.string().min(1)),
});
