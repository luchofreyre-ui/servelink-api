import { Module } from "@nestjs/common";
import { ServiceMatrixEvaluator } from "./service-matrix.evaluator";

/**
 * S1 shell: exported for unit tests / future wiring only. Not registered in `AppModule`.
 */
@Module({
  providers: [ServiceMatrixEvaluator],
  exports: [ServiceMatrixEvaluator],
})
export class ServiceMatrixModule {}
