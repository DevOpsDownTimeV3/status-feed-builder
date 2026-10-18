# Contributing

Thanks for your interest in improving the status feed builder.

## Development

```bash
git clone https://github.com/DevOpsDownTimeV3/status-feed-builder.git
cd status-feed-builder
npm ci
npm test
```

## Pull requests

- Fork the repository
- Create a feature branch
- Make your changes and add tests
- Run `npm test && npm run lint` before pushing
- Open a PR against `main`

First-time contributors may need a maintainer to approve the CI run.

## Preview bundle

The CI pipeline builds a preview bundle on every PR. A separate workflow validates and publishes the rendered output to the internal dashboard. You don't need to worry about the publish step — it runs automatically after CI passes.
