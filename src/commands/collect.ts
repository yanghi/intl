import { NormalizeConfiguration } from "@/configuration/configuration";
import { loadConfiguration } from "@/configuration/load";
import { collect, printCollectMergeSummary, type CollectOptions } from "@/features/collect/collect";

export async function runCollectCommand(
  options: { c?: string } & CollectOptions,
  ..._args: unknown[]
): Promise<void> {
  const configurePath = options.c;
  let configure: NormalizeConfiguration | undefined;
  if(configurePath){
     configure = loadConfiguration(process.cwd(), configurePath);
  }

  const result = await collect(options, configure);
  if (result.mergeReport) {
    printCollectMergeSummary(result.mergeReport, result.usage);
  }
}
