export async function render(context) {
  return JSON.stringify({
    generatedAt: context.generatedAt,
    services: context.services
  }, null, 2) + "\n";
}
