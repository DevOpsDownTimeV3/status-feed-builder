export interface ServiceEntry {
  name: string;
  slug: string;
  endpoint: string;
  region: string;
  owner: string;
  tags: string[];
}

export function validateService(value: unknown, source: string): ServiceEntry {
  if (!value || typeof value !== "object") throw new Error(`${source}: expected an object`);
  const svc = value as Record<string, unknown>;
  if (typeof svc.name !== "string" || typeof svc.slug !== "string") throw new Error(`${source}: name and slug are required`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(svc.slug)) throw new Error(`${source}: invalid slug`);
  if (typeof svc.endpoint !== "string") throw new Error(`${source}: endpoint is required`);
  if (typeof svc.region !== "string") throw new Error(`${source}: region is required`);
  if (typeof svc.owner !== "string") throw new Error(`${source}: owner is required`);
  if (!Array.isArray(svc.tags) || svc.tags.some((t) => typeof t !== "string")) throw new Error(`${source}: tags must be strings`);
  return { name: svc.name, slug: svc.slug, endpoint: svc.endpoint, region: svc.region, owner: svc.owner, tags: svc.tags };
}
