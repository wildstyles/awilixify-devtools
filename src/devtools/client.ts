import type { ModuleGraph, ProviderImpact } from "../graph/graph.types";

export const DEFAULT_GRAPH_URL = "/__devtools/graph";
export const DEFAULT_IMPACT_URL = "/__devtools/impact";

export function getGraphUrl() {
  return import.meta.env.VITE_DEVTOOLS_GRAPH_URL ?? DEFAULT_GRAPH_URL;
}

export function getImpactUrl() {
  return import.meta.env.VITE_DEVTOOLS_IMPACT_URL ?? DEFAULT_IMPACT_URL;
}

export async function fetchModuleGraph(
  signal?: AbortSignal,
): Promise<ModuleGraph> {
  const graphUrl = getGraphUrl();
  const response = await fetch(graphUrl, {
    headers: {
      accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Graph request failed with ${response.status}`);
  }

  return response.json() as Promise<ModuleGraph>;
}

export async function fetchProviderImpact(
  signal?: AbortSignal,
): Promise<ProviderImpact> {
  const impactUrl = getImpactUrl();
  const response = await fetch(impactUrl, {
    headers: {
      accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Impact request failed with ${response.status}`);
  }

  return response.json() as Promise<ProviderImpact>;
}
