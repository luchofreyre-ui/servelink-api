import { describe, expect, it } from "vitest";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
  buildDefinedTermSchema,
  buildFaqSchema,
} from "../authoritySchema";

describe("authoritySchema", () => {
  it("builds breadcrumb schema", () => {
    const schema = buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Methods", href: "/methods" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
  });

  it("builds article schema", () => {
    const schema = buildArticleSchema({
      title: "Test",
      description: "Desc",
      path: "/guides/test",
    });
    expect(schema["@type"]).toBe("Article");
  });

  it("builds defined term schema", () => {
    const schema = buildDefinedTermSchema({
      name: "Soap scum",
      description: "Residue",
      path: "/problems/soap-scum",
    });
    expect(schema["@type"]).toBe("DefinedTerm");
  });

  it("builds faq schema", () => {
    const schema = buildFaqSchema([
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ]);
    expect(schema["@type"]).toBe("FAQPage");
    expect(Array.isArray(schema.mainEntity)).toBe(true);
  });

  it("builds collection page schema", () => {
    const schema = buildCollectionPageSchema({
      title: "Methods",
      description: "All methods",
      path: "/methods",
    });
    expect(schema["@type"]).toBe("CollectionPage");
  });
});
