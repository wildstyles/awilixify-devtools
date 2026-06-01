import { useEffect, useState } from "react";
import {
  fetchModuleGraph,
  fetchProviderImpact,
} from "../../../devtools/client";
import type { ModuleGraph, ProviderImpact } from "../../../graph/graph.types";
import { sampleGraph } from "../../../graph/sampleGraph";
import { emptyImpact } from "../constants";

export function useModuleGraphData(refreshToken: number): {
  error: string | null;
  graph: ModuleGraph;
  loading: boolean;
  providerImpact: ProviderImpact;
} {
  const [graph, setGraph] = useState<ModuleGraph>(sampleGraph);
  const [providerImpact, setProviderImpact] =
    useState<ProviderImpact>(emptyImpact);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    Promise.all([
      fetchModuleGraph(controller.signal),
      fetchProviderImpact(controller.signal).catch(() => emptyImpact),
    ])
      .then(([nextGraph, nextImpact]) => {
        setGraph(nextGraph);
        setProviderImpact(nextImpact);
        setError(null);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setProviderImpact(emptyImpact);
        setError(
          reason instanceof Error ? reason.message : "Graph unavailable",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [refreshToken]);

  return { error, graph, loading, providerImpact };
}
