import { Injectable } from "@nestjs/common";
import {
  mapAuthorityTagsToFoKnowledgeLinks,
  type FoKnowledgeLinkItem,
} from "./fo-authority-knowledge.mapper";

@Injectable()
export class FoAuthorityKnowledgeLinkService {
  resolveLinks(input: {
    surfaces?: string[];
    problems?: string[];
    methods?: string[];
  }): { kind: "fo_authority_knowledge_links"; links: FoKnowledgeLinkItem[] } {
    return {
      kind: "fo_authority_knowledge_links",
      links: mapAuthorityTagsToFoKnowledgeLinks(input),
    };
  }
}
