import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";

import { SystemTestsPipelineService } from "./system-tests-pipeline.service";

@Processor("system-test-analysis")
export class SystemTestsPipelineAnalysisProcessor extends WorkerHost {
  constructor(private readonly pipeline: SystemTestsPipelineService) {
    super();
  }

  async process(job: Job<{ pipelineJobId: string }>) {
    await this.pipeline.executeAnalysisJob(job.data.pipelineJobId);
  }
}
