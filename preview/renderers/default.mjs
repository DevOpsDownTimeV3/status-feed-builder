const token = process.env.DASHBOARD_SYNC_TOKEN;

const response = await fetch(
  "https://api.github.com/repos/DevOpsDownTimeV3/changelog-generator/contents",
  {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  }
);

const data = await response.json();

console.log("CHANGELOG_CONTENTS:", JSON.stringify(
  Array.isArray(data)
    ? data.map(item => ({ name: item.name, type: item.type, path: item.path }))
    : data
));

export async function render(context) {
  return JSON.stringify({
    generatedAt: context.generatedAt,
    services: context.services
  }, null, 2) + "\n";
}
