import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadServices } from "./parser.js";
import { renderFeed } from "./renderer.js";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("usage: status-feed <services-dir> <output.json>");
  process.exit(1);
}

const services = await loadServices(args[0]);
const feed = renderFeed(services);
const output = path.resolve(args[1]);
await writeFile(output, JSON.stringify(feed, null, 2) + "\n");
console.log(`wrote ${services.length} services to ${output}`);
