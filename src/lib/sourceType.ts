import type { DerivedSourceType } from "@/lib/types";

export function deriveSourceType(sourceName: string): DerivedSourceType {
  const name = sourceName.toLowerCase();
  if (name.includes("oceanfrogs")) return "Vendor claim";
  if (name.includes("government") || name.includes("minister")) {
    return "State claim";
  }
  return "Report / press";
}
