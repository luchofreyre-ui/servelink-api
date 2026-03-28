import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";

import { SystemTestsPipelineService } from "./system-tests-pipeline.service";

@Processor("system-test-automation")
export class SystemTestsPipelineAutomationProcessor extends WorkerHost {
  constructor(private readonly pipeline: SystemTestsPipelineService) {
    super();
  }

  async process(job: Job<{ pipelineJobId: string }>) {
    await this.pipeline.executeAutomationJob(job.data.pipelineJobId);
  }
}
