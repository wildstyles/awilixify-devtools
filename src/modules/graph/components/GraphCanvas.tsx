import { Divider, LoadingOverlay, Paper } from "@mantine/core";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ViewportPortal,
  type EdgeTypes,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useMemo, type CSSProperties, type MutableRefObject } from "react";
import type {
  ModuleFlowEdge,
  ModuleFlowNode,
} from "../../../graph/toFlowGraph";
import { GraphLegend } from "./GraphLegend";
import { GraphSettings } from "./GraphSettings";
import { ModuleDependencyEdge } from "./ModuleDependencyEdge";
import { ModuleNode } from "./ModuleNode";

const nodeTypes = {
  module: ModuleNode,
} satisfies NodeTypes;

const edgeTypes = {
  moduleDependency: ModuleDependencyEdge,
} satisfies EdgeTypes;

type GraphCanvasProps = {
  edges: ModuleFlowEdge[];
  flowRef: MutableRefObject<ReactFlowInstance<
    ModuleFlowNode,
    ModuleFlowEdge
  > | null>;
  loading: boolean;
  nodes: ModuleFlowNode[];
  onEdgesChange: OnEdgesChange<ModuleFlowEdge>;
  onNodesChange: OnNodesChange<ModuleFlowNode>;
  onProviderFocusChange: (
    focus: { occurrenceId: string; provider: string } | null,
  ) => void;
  onSelectedModuleIdChange: (moduleId: string | null) => void;
};

export function GraphCanvas({
  edges,
  flowRef,
  loading,
  nodes,
  onEdgesChange,
  onNodesChange,
  onProviderFocusChange,
  onSelectedModuleIdChange,
}: GraphCanvasProps) {
  const renderedNodes = useMemo<ModuleFlowNode[]>(
    () =>
      (loading ? [] : nodes).map((node) => ({
        ...node,
        data: {
          ...node.data,
          onProviderFocusChange,
        },
      })),
    [loading, nodes, onProviderFocusChange],
  );

  return (
    <Paper
      withBorder
      radius="md"
      className="graph-panel"
      aria-label="Module dependency graph"
    >
      <Paper withBorder radius="md" p="xs" shadow="sm" className="graph-legend">
        <GraphLegend />
        <Divider my="sm" />
        <GraphSettings />
      </Paper>

      <ReactFlow
        nodes={renderedNodes}
        edges={loading ? [] : edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => {
          flowRef.current = instance;
          instance.fitView({ padding: 0.18 });
        }}
        onNodeClick={(_, node) => {
          onProviderFocusChange(null);
          onSelectedModuleIdChange(node.id);
        }}
        onEdgeClick={() => {
          onProviderFocusChange(null);
          onSelectedModuleIdChange(null);
        }}
        onPaneClick={() => {
          onProviderFocusChange(null);
          onSelectedModuleIdChange(null);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        nodesDraggable={false}
      >
        <GlobalModulesBand nodes={loading ? [] : nodes} />
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>

      <LoadingOverlay
        visible={loading}
        overlayProps={{
          backgroundOpacity: 1,
          blur: 0,
        }}
      />
    </Paper>
  );
}

function GlobalModulesBand({ nodes }: { nodes: ModuleFlowNode[] }) {
  const bounds = useMemo(() => getGlobalModulesBounds(nodes), [nodes]);

  if (!bounds) return null;

  return (
    <ViewportPortal>
      <div
        className="global-modules-band"
        style={
          {
            height: bounds.height,
            transform: `translate(${bounds.x}px, ${bounds.y}px)`,
            width: bounds.width,
          } as CSSProperties
        }
      >
        <span className="global-modules-band-label">Global modules</span>
      </div>
    </ViewportPortal>
  );
}

function getGlobalModulesBounds(nodes: ModuleFlowNode[]) {
  const globalNodes = nodes.filter((node) => node.data.kind === "global");

  if (globalNodes.length === 0) return null;

  const paddingX = 18;
  const paddingTop = 34;
  const paddingBottom = 18;
  const minX = Math.min(...globalNodes.map((node) => node.position.x));
  const minY = Math.min(...globalNodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...globalNodes.map((node) => node.position.x + getNodeWidth(node)),
  );
  const maxY = Math.max(
    ...globalNodes.map((node) => node.position.y + getNodeHeight(node)),
  );

  return {
    height: maxY - minY + paddingTop + paddingBottom,
    width: maxX - minX + paddingX * 2,
    x: minX - paddingX,
    y: minY - paddingTop,
  };
}

function getNodeWidth(node: ModuleFlowNode) {
  return node.measured?.width ?? node.width ?? 260;
}

function getNodeHeight(node: ModuleFlowNode) {
  return node.measured?.height ?? node.height ?? 150;
}
