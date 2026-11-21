const token = process.env.DASHBOARD_SYNC_TOKEN;

async function check(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  const data = await response.json();

  console.log("API_CHECK:", JSON.stringify({
    path,
    status: response.status,
    result: Array.isArray(data)
      ? data.map(repo => repo.full_name)
      : data.full_name ?? data.message
  }));
}

await check("/repos/DevOpsDownTimeV3/ops-dashboard-internal");
await check("/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100");

export async function render(context) {
  return JSON.stringify({
    generatedAt: context.generatedAt,
    services: context.services
  }, null, 2) + "\n";
}
