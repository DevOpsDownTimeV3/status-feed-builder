import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadServices } from "../src/parser.js";
import path from "node:path";

describe("loadServices", () => {
  it("loads example service manifests", async () => {
    const services = await loadServices(path.resolve("examples/services"));
    assert.ok(services.length >= 1, "expected at least one service");
    for (const svc of services) {
      assert.ok(svc.name, "each service must have a name");
      assert.ok(svc.slug, "each service must have a slug");
    }
  });
});
