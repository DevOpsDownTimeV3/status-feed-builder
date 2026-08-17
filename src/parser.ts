import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { validateService, type ServiceEntry } from "./schema.js";

export async function loadServices(directory: string): Promise<ServiceEntry[]> {
  const files = (await readdir(directory)).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort();
  const services = await Promise.all(files.map(async (file) => {
    const source = path.join(directory, file);
    return validateService(parse(await readFile(source, "utf8")), file);
  }));
  const slugs = new Set<string>();
  for (const svc of services) {
    if (slugs.has(svc.slug)) throw new Error(`duplicate service slug: ${svc.slug}`);
    slugs.add(svc.slug);
  }
  return services;
}
