import { execSync } from "node:child_process";

function run(command: string): void {
  console.log(`\n$ ${command}\n`);
  execSync(command, { stdio: "inherit" });
}

function main(): void {
  run("npm run preview:amazon-paste-import");
  run("npm run report:amazon-catalog-health");
  run("npm run report:amazon-catalog-fill-status");
}

main();
