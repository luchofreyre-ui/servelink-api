import { Module } from "@nestjs/common";
import { KnowledgeFoController } from "./knowledge.fo.controller";
import { KnowledgeService } from "./knowledge.service";

@Module({
  controllers: [KnowledgeFoController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
