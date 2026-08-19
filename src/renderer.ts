import type { ServiceEntry } from "./schema.js";

export interface StatusFeed {
  generatedAt: string;
  services: ServiceEntry[];
}

export function renderFeed(services: ServiceEntry[], now = new Date()): StatusFeed {
  return { generatedAt: now.toISOString(), services };
}
