import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import {
	Background,
	BaseEdge,
	Controls,
	type Edge,
	EdgeLabelRenderer,
	type EdgeProps,
	getSmoothStepPath,
	Handle,
	MarkerType,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import { useMemo } from "react";
import type {
	GetGraphResponse,
	Trace,
	TraceSpan,
	TraceSpanStatus,
	TraceSpanKind,
} from "@/api/model";
import { getSpanColor } from "./traceFormatting";
import { useGetDevtoolsGraphSuspense } from "@/api/graph/graph";

type TraceTreeTabProps = {
	trace: Trace;
};

type TraceCallTreeNode = {
	children: TraceCallTreeNode[];
	depth: number;
	moduleName: string;
	order: number;
	providerKey: string;
	span: TraceSpan;
};

type MethodNodeData = Record<string, unknown> & {
	childCount: number;
	durationMs: number;
	kind: TraceSpanKind;
	methodName: string;
	moduleName: string;
	order: number;
	providerKey: string;
	status: TraceSpanStatus;
};

type CallEdgeData = Record<string, unknown> & {
	label: string;
};

type MethodGraphNode = Node<MethodNodeData, "methodCall">;
type MethodGraphEdge = Edge<CallEdgeData, "callEdge">;

export function TraceTreeTab({ trace }: TraceTreeTabProps) {
	const { data: graph } = useGetDevtoolsGraphSuspense();

	const callTree = useMemo(
		() => buildTraceCallTree(graph, trace),
		[graph, trace],
	);
	const flowGraph = useMemo(() => buildFlowGraph(callTree.roots), [callTree]);
	const nodeTypes = useMemo(
		() => ({
			methodCall: MethodCallNode,
		}),
		[],
	);
	const edgeTypes = useMemo(
		() => ({
			callEdge: CallEdge,
		}),
		[],
	);

	if (callTree.roots.length === 0) {
		return (
			<Paper withBorder radius="sm" p="md">
				<Text c="dimmed" size="sm">
					No method calls were found for this trace.
				</Text>
			</Paper>
		);
	}

	return (
		<Stack gap="sm">
			<Group gap="xs">
				<Badge color="blue" variant="light">
					{callTree.providerCount} providers
				</Badge>
				<Badge color="gray" variant="light">
					{callTree.methodCount} method calls
				</Badge>
			</Group>
			<Paper
				withBorder
				radius="sm"
				style={{
					height: 620,
					overflow: "hidden",
				}}
			>
				<ReactFlow
					fitView
					fitViewOptions={{ padding: 0.18 }}
					minZoom={0.25}
					nodes={flowGraph.nodes}
					edges={flowGraph.edges}
					edgeTypes={edgeTypes}
					nodeTypes={nodeTypes}
					nodesDraggable={false}
					proOptions={{ hideAttribution: true }}
				>
					<Background />
					<Controls />
				</ReactFlow>
			</Paper>
		</Stack>
	);
}

function CallEdge({
	data,
	markerEnd,
	sourceX,
	sourceY,
	sourcePosition,
	style,
	targetX,
	targetY,
	targetPosition,
}: EdgeProps<MethodGraphEdge>) {
	const [edgePath] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});
	const labelX = targetX;
	const labelY = targetY - 30;

	return (
		<>
			<BaseEdge markerEnd={markerEnd} path={edgePath} style={style} />
			<EdgeLabelRenderer>
				<div
					style={{
						background: "white",
						border: "1px solid #99f6e4",
						borderRadius: 6,
						color: "#0f766e",
						fontSize: 12,
						fontWeight: 700,
						padding: "3px 8px",
						pointerEvents: "none",
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
						whiteSpace: "nowrap",
					}}
				>
					{data?.label}
				</div>
			</EdgeLabelRenderer>
		</>
	);
}

function MethodCallNode({ data }: NodeProps<MethodGraphNode>) {
	return (
		<Paper
			withBorder
			radius="sm"
			p={8}
			style={{
				background: data.status === "error" ? "#fff5f5" : "white",
				height: "100%",
				width: "100%",
			}}
		>
			<Handle type="target" position={Position.Top} />
			<Group gap="xs" wrap="nowrap">
				<Badge color="dark" radius="xl" size="xs">
					#{data.order}
				</Badge>
				<Badge color={getSpanColor(data.kind)} size="xs" variant="light">
					{data.kind}
				</Badge>
				<Text c="dimmed" ml="auto" size="xs">
					{Math.round(data.durationMs)} ms
				</Text>
			</Group>
			<Text fw={700} lineClamp={1} mt={4} size="sm">
				{data.methodName}
			</Text>
			<Group gap={6} mt={2} wrap="nowrap">
				<Text c="dimmed" lineClamp={1} size="xs">
					{data.moduleName} / {data.providerKey}
				</Text>
				{data.childCount > 0 && (
					<Text c="dimmed" size="xs">
						calls {data.childCount}
					</Text>
				)}
			</Group>
			<Handle type="source" position={Position.Bottom} />
		</Paper>
	);
}

function buildFlowGraph(roots: TraceCallTreeNode[]): {
	edges: MethodGraphEdge[];
	nodes: MethodGraphNode[];
} {
	const nodes: MethodGraphNode[] = [];
	const edges: MethodGraphEdge[] = [];
	const nodeWidth = 260;
	const leafSiblingGap = 286;
	const nestedSiblingGap = 330;
	const yGap = 150;
	const nextXByDepth = new Map<number, number>();

	const getSiblingGap = (left: TraceCallTreeNode, right: TraceCallTreeNode) =>
		left.children.length > 0 || right.children.length > 0
			? nestedSiblingGap
			: leafSiblingGap;
	const reserveX = (depth: number, desiredX: number) => {
		const nextX = nextXByDepth.get(depth) ?? Number.NEGATIVE_INFINITY;
		const x = Math.max(desiredX, nextX);
		nextXByDepth.set(depth, x + leafSiblingGap);

		return x;
	};

	const visit = (
		node: TraceCallTreeNode,
		parent: TraceCallTreeNode | null,
		desiredX: number,
	) => {
		const x = reserveX(node.depth, desiredX);

		nodes.push({
			id: node.span.id,
			type: "methodCall",
			position: {
				x,
				y: node.depth * yGap,
			},
			data: {
				childCount: node.children.length,
				durationMs: node.span.durationMs,
				kind: node.span.kind,
				methodName: node.span.methodName ?? node.span.label,
				moduleName: node.moduleName,
				order: node.order,
				providerKey: node.providerKey,
				status: node.span.status,
			},
			style: {
				height: 86,
				width: nodeWidth,
			},
		});

		if (parent) {
			edges.push({
				id: `${parent.span.id}->${node.span.id}`,
				source: parent.span.id,
				target: node.span.id,
				type: "callEdge",
				data: {
					label: `#${parent.order} -> #${node.order}`,
				},
				markerEnd: {
					type: MarkerType.ArrowClosed,
					color: "#0f766e",
				},
				style: {
					stroke: "#0f766e",
					strokeWidth: 2,
				},
			});
		}

		if (node.children.length === 0) return;

		const totalSiblingWidth = node.children.reduce((width, child, index) => {
			if (index === 0) return width;
			return width + getSiblingGap(node.children[index - 1], child);
		}, 0);
		const firstChildX = x - totalSiblingWidth / 2;

		node.children.forEach((child, index) => {
			const previousChildrenWidth = node.children
				.slice(1, index + 1)
				.reduce(
					(width, currentChild, childIndex) =>
						width + getSiblingGap(node.children[childIndex], currentChild),
					0,
				);

			visit(child, node, firstChildX + previousChildrenWidth);
		});
	};

	roots.forEach((root, index) => {
		visit(root, null, index * nestedSiblingGap);
	});

	return { edges, nodes };
}

function buildTraceCallTree(graph: GetGraphResponse, trace: Trace) {
	const moduleIdByName = new Map(
		graph.modules.map((module) => [module.name, module.id]),
	);
	const moduleNameById = new Map(
		graph.modules.map((module) => [module.id, module.name]),
	);
	const bySpanId = new Map<string, TraceCallTreeNode>();
	const roots: TraceCallTreeNode[] = [];
	const touchedProviders = new Set<string>();

	trace.spans.forEach((span, index) => {
		if (!span.providerKey) return;

		const moduleId =
			span.moduleId ??
			(span.moduleName ? moduleIdByName.get(span.moduleName) : undefined) ??
			span.moduleName ??
			"unknown-module";
		const moduleName =
			moduleNameById.get(moduleId) ?? span.moduleName ?? String(moduleId);

		touchedProviders.add(`${moduleId}:${span.providerKey}`);
		bySpanId.set(span.id, {
			children: [],
			depth: 0,
			moduleName,
			order: index + 1,
			providerKey: span.providerKey,
			span,
		});
	});

	for (const node of bySpanId.values()) {
		const parent = node.span.parentId ? bySpanId.get(node.span.parentId) : null;
		if (!parent) {
			roots.push(node);
			continue;
		}

		node.depth = parent.depth + 1;
		parent.children.push(node);
	}

	sortTree(roots);

	return {
		methodCount: bySpanId.size,
		providerCount: touchedProviders.size,
		roots,
	};
}

function sortTree(nodes: TraceCallTreeNode[]) {
	nodes.sort((left, right) => left.order - right.order);

	for (const node of nodes) {
		sortTree(node.children);
	}
}
