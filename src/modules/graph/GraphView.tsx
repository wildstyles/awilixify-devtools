import { Drawer, Stack } from "@mantine/core";
import {
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { layoutGraph } from "../../graph/layoutGraph";
import {
  toFlowGraph,
  type ModuleFlowEdge,
  type ModuleFlowNode,
} from "../../graph/toFlowGraph";
import { GraphCanvas } from "./components/GraphCanvas";
import { GraphToolbar } from "./components/GraphToolbar";
import { ModuleInspector } from "./components/ModuleInspector";
import {
  GraphSettingsProvider,
  useGraphSettings,
} from "./GraphSettingsContext";
import { useModuleGraphData } from "./hooks/useModuleGraphData";

export function GraphView() {
  return (
    <GraphSettingsProvider>
      <GraphViewContent />
    </GraphSettingsProvider>
  );
}

function GraphViewContent() {
  const [providerFocus, setProviderFocus] = useState<{
    occurrenceId: string;
    provider: string;
  } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState<ModuleFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ModuleFlowEdge>([]);
  const { error, graph, loading, providerImpact } =
    useModuleGraphData(refreshToken);
  const {
    groupDynamicModules,
    hideInternalModules,
    impactOnly,
    searchQuery,
    selectedModuleId,
    setSelectedModuleId,
    setSelectedModuleAvailable,
    showGlobalEdges,
    showRelatedOnly,
    viewMode,
  } = useGraphSettings();
  const flowRef = useRef<ReactFlowInstance<
    ModuleFlowNode,
    ModuleFlowEdge
  > | null>(null);

  const selectedModule = useMemo(
    () =>
      selectedModuleId
        ? (nodes.find((node) => node.id === selectedModuleId)?.data ?? null)
        : null,
    [nodes, selectedModuleId],
  );

  useEffect(() => {
    setSelectedModuleAvailable(selectedModule !== null || providerFocus !== null);
  }, [providerFocus, selectedModule, setSelectedModuleAvailable]);

  useEffect(() => {
    const flowGraph = toFlowGraph(graph, {
      selectedModuleId,
      groupDynamicModules,
      impactOnly,
      providerImpact,
      providerFocus,
      relatedOnly: showRelatedOnly,
      searchQuery,
      showGlobalEdges,
      showInternalModules: !hideInternalModules,
      viewMode,
    });

    layoutGraph(flowGraph.nodes, flowGraph.edges, {
      pinGlobalModulesToTop: true,
    }).then((layouted) => {
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      window.requestAnimationFrame(() => {
        flowRef.current?.fitView({
          padding: 0.18,
          duration: 180,
        });
      });
    });
  }, [
    graph,
    groupDynamicModules,
    hideInternalModules,
    impactOnly,
    providerFocus,
    providerImpact,
    selectedModuleId,
    setEdges,
    setNodes,
    showRelatedOnly,
    searchQuery,
    showGlobalEdges,
    viewMode,
  ]);

  return (
    <Stack gap="md">
      <GraphToolbar
        error={error}
        onRefresh={() => setRefreshToken((value) => value + 1)}
      />

      <GraphCanvas
        edges={edges}
        flowRef={flowRef}
        loading={loading}
        nodes={nodes}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        onProviderFocusChange={setProviderFocus}
        onSelectedModuleIdChange={setSelectedModuleId}
      />

      <Drawer
        opened={selectedModule !== null}
        onClose={() => setSelectedModuleId(null)}
        position="right"
        size={340}
        title={selectedModule?.name ?? "Module"}
        padding="md"
        trapFocus={false}
        closeOnEscape={false}
        closeOnClickOutside={false}
        withOverlay={false}
        overlayProps={{
          backgroundOpacity: 0,
          blur: 0,
        }}
      >
        <ModuleInspector edges={edges} module={selectedModule} nodes={nodes} />
      </Drawer>
    </Stack>
  );
}
