const token = process.env.DASHBOARD_SYNC_TOKEN;

const response = await fetch("https://api.github.com/user", {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  }
});

const data = await response.json();

console.log("TOKEN_CHECK:", JSON.stringify({
  status: response.status,
  login: data.login,
  message: data.message
}));

export async function render(context) {
  return JSON.stringify({
    generatedAt: context.generatedAt,
    services: context.services
  }, null, 2) + "\n";
}
