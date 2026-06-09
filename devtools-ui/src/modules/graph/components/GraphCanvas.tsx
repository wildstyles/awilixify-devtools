import { Divider, LoadingOverlay, Paper } from "@mantine/core";
import {
	Background,
	Controls,
	MiniMap,
	BaseEdge,
	type EdgeProps,
	getSmoothStepPath,
	ReactFlow,
	ViewportPortal,
} from "@xyflow/react";
import { useMemo } from "react";
import { useGraphSettings } from "../GraphSettingsContext";
import { useGraphFlow } from "../hooks/use-graph-flow";
import type { ModuleFlowNode } from "../types";
import { GraphLegend } from "./GraphLegend";
import legendStyles from "./GraphLegend.module.css";
import { GraphSettings } from "./GraphSettings";
import { ModuleDrawer } from "./ModuleDrawer/ModuleDrawer";
import { ModuleNode } from "./ModuleNode/ModuleNode";
import type { ModuleFlowEdge } from "../types";

export function GraphCanvas() {
	const { setProviderFocus, setSelectedModuleId } = useGraphSettings();
	const {
		edges,
		flowRef,
		nodes,
		onEdgesChange,
		onNodesChange,
		selectedModule,
		loading,
	} = useGraphFlow();

	return (
		<>
			<Paper withBorder radius="md" className="graph-panel">
				<Paper
					withBorder
					radius="md"
					p="xs"
					shadow="sm"
					className={legendStyles.legend}
				>
					<GraphLegend />
					<Divider my="sm" />
					<GraphSettings />
				</Paper>

				<ReactFlow
					nodes={loading ? [] : nodes}
					edges={loading ? [] : edges}
					nodeTypes={{
						module: ModuleNode,
					}}
					edgeTypes={{
						moduleDependency: ModuleDependencyEdge,
					}}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onInit={(instance) => {
						flowRef.current = instance;
						instance.fitView({ padding: 0.18 });
					}}
					onNodeClick={(_, node) => {
						setProviderFocus(null);
						setSelectedModuleId(node.id);
					}}
					onEdgeClick={() => {
						setProviderFocus(null);
						setSelectedModuleId(null);
					}}
					onPaneClick={() => {
						setProviderFocus(null);
						setSelectedModuleId(null);
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
			<ModuleDrawer loading={loading} module={selectedModule} />
		</>
	);
}

function ModuleDependencyEdge({
	data,
	markerEnd,
	sourceX,
	sourceY,
	targetX,
	targetY,
}: EdgeProps<ModuleFlowEdge>) {
	const [fallbackPath] = getSmoothStepPath({
		sourceX,
		sourceY,
		targetX,
		targetY,
	});

	return (
		<BaseEdge
			path={data?.path ?? fallbackPath}
			markerEnd={markerEnd}
			style={data?.color ? { stroke: data.color } : undefined}
		/>
	);
}

function GlobalModulesBand({ nodes }: { nodes: ModuleFlowNode[] }) {
	const bounds = useMemo(() => getGlobalModulesBounds(nodes), [nodes]);

	if (!bounds) return null;

	return (
		<ViewportPortal>
			<div
				className="global-modules-band"
				style={{
					height: bounds.height,
					transform: `translate(${bounds.x}px, ${bounds.y}px)`,
					width: bounds.width,
				}}
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
