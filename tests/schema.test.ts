import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateService } from "../src/schema.js";

describe("validateService", () => {
  it("accepts a valid service manifest", () => {
    const result = validateService({
      name: "Auth Gateway",
      slug: "auth-gateway",
      endpoint: "https://auth.internal.example.com",
      region: "ap-south-1",
      owner: "platform-team",
      tags: ["auth", "critical"],
    }, "test.yaml");
    assert.equal(result.slug, "auth-gateway");
    assert.equal(result.region, "ap-south-1");
  });

  it("rejects an invalid slug", () => {
    assert.throws(() => validateService({
      name: "Bad Slug", slug: "Bad_Slug", endpoint: "https://x.com",
      region: "us-east-1", owner: "team", tags: [],
    }, "test.yaml"), /invalid slug/);
  });

  it("rejects missing fields", () => {
    assert.throws(() => validateService({ name: "Only Name" }, "test.yaml"), /slug/);
  });

  it("rejects non-string tags", () => {
    assert.throws(() => validateService({
      name: "X", slug: "x", endpoint: "https://x.com",
      region: "us-east-1", owner: "team", tags: [1, 2],
    }, "test.yaml"), /tags/);
  });
});
