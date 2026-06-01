# Awilixify DevTools

React application for visualizing Awilixify module graphs.

## Planned Scope

- Render module dependency graphs from Awilixify applications.
- Inspect module providers, controllers, handlers, initializers, and lifecycle metadata.
- Start with static graph input, then add a dev-only integration endpoint/protocol.

## Local Development

Dependencies are intentionally not installed in this scaffold.

```sh
npm install
npm run dev
```

By default, the app fetches the module graph from:

```txt
/__devtools/graph
```

During Vite development, `/__devtools` is proxied to:

```txt
http://localhost:3000
```

Override it with:

```sh
VITE_DEVTOOLS_GRAPH_URL=http://localhost:3000/__devtools/graph npm run dev
```
