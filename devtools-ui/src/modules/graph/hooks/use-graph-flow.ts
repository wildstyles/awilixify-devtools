import {
	type ReactFlowInstance,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useEffect, useMemo, useRef } from "react";
import { useGraphSettings } from "../GraphSettingsContext.js";
import type { ModuleFlowEdge, ModuleFlowNode } from "../types";
import { toFlowEdges } from "./flow-edges";
import { toFlowNodes } from "./flow-nodes";
import { layout } from "./graph-layout";
import {
	filterProviderFocusGraph,
	getProviderFocusState,
} from "./provider-focus";
import { useModuleGraphData } from "./use-module-graph-data.js";

export function useGraphFlow() {
	const { graph, loading } = useModuleGraphData();
	const {
		providerFocus,
		selectedModuleId,
		setSelectedModuleAvailable,
		showRelatedOnly,
		viewMode,
	} = useGraphSettings();

	const [nodes, setNodes, onNodesChange] = useNodesState<ModuleFlowNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<ModuleFlowEdge>([]);
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
		setSelectedModuleAvailable(
			selectedModule !== null || providerFocus !== null,
		);
	}, [providerFocus, selectedModule, setSelectedModuleAvailable]);

	useEffect(() => {
		if (!graph) {
			setNodes([]);
			setEdges([]);
			return;
		}

		const providerFocusState = getProviderFocusState(
			graph.modules,
			providerFocus,
		);
		const visibleGraph = filterProviderFocusGraph({
			graph,
			providerFocus,
			relatedOnly: showRelatedOnly,
		});

		const flowNodes = toFlowNodes({
			graph: visibleGraph,
			providerFocus: providerFocusState,
			selectedModuleId,
			viewMode,
		});
		const flowEdges = toFlowEdges({
			edges: visibleGraph.edges,
			selectedModuleId,
			viewMode,
		});

		layout(flowNodes, flowEdges, {
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
		providerFocus,
		selectedModuleId,
		setEdges,
		setNodes,
		showRelatedOnly,
		viewMode,
	]);

	return {
		loading,
		edges,
		flowRef,
		nodes,
		onEdgesChange,
		onNodesChange,
		selectedModule,
	};
}
