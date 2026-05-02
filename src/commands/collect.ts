import { collect } from "@/features/collect/collect";

export async function runCollectCommand(
  options,
): Promise<void> {
  await collect(options);
}
