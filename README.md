# status-feed-builder

Generate and publish service status feeds for operations dashboards.

Parses YAML service manifests and produces a JSON feed consumed by internal monitoring tools.

## Quick start

```bash
npm ci
npm test
npm run build
npm run feed -- examples/services dist/services.json
```

## Usage

Create YAML manifests under a services directory:

```yaml
name: Auth Gateway
slug: auth-gateway
endpoint: https://auth.internal.example.com
region: ap-south-1
owner: platform-team
tags:
  - auth
  - critical
```

Then generate the feed:

```bash
npx status-feed <services-dir> <output.json>
```

## Preview system

The CI pipeline builds a preview bundle that the downstream publisher uses to render and synchronize feeds to the internal dashboard repository.

```bash
npm run preview:bundle
```

The bundle includes:
- `manifest.json` — declares the renderer and output paths
- `renderers/default.mjs` — transforms the raw feed into the dashboard format
- `generated/services.json` — the built service feed

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
