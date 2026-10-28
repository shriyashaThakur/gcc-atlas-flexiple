import raw from "@/data/gcc_data.json";
import type { GccData } from "@/lib/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertGccData(value: unknown): GccData {
  if (!isObject(value)) {
    throw new Error("GCC Atlas data is not an object.");
  }
  const required = [
    "meta",
    "registry",
    "signals",
    "cities",
    "disagreements",
    "candidates_unverified",
  ] as const;
  for (const key of required) {
    if (!(key in value)) {
      throw new Error(`GCC Atlas data is missing "${key}".`);
    }
  }
  if (!isObject(value.meta) || typeof value.meta.banner !== "string") {
    throw new Error("GCC Atlas meta.banner is missing.");
  }
  if (!Array.isArray(value.registry) || !Array.isArray(value.signals)) {
    throw new Error("GCC Atlas registry or signals is not an array.");
  }
  return value as GccData;
}

export const gccData: GccData = assertGccData(raw);

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function registrySectors(data: GccData): string[] {
  return uniqueSorted(data.registry.map((row) => row.sector));
}

export function registryCities(data: GccData): string[] {
  return uniqueSorted(data.registry.map((row) => row.city));
}

export function registryConfidences(data: GccData): string[] {
  return uniqueSorted(data.registry.map((row) => row.confidence));
}
