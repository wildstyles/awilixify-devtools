import clsx from "clsx";
import type { GetGraphResponse } from "@/api/model";
import type {
	GraphViewMode,
	ModuleFlowNode,
	ModuleNodeData,
	ProviderFocusState,
} from "../types";
import {
	getImportedProviderGroups,
	getLifetimeTypeByName,
	getProviderGroupColor,
} from "./provider-group";

export function toFlowNodes({
	graph,
	providerFocus,
	selectedModuleId,
	viewMode,
}: {
	graph: GetGraphResponse;
	providerFocus: ProviderFocusState | null;
	selectedModuleId?: string | null;
	viewMode: GraphViewMode;
}): ModuleFlowNode[] {
	const { modules, edges, globalProviderGroups } = graph;

	const moduleById = new Map(modules.map((module) => [module.id, module]));
	const directDependencyIds = getDirectDependencyIds(edges, selectedModuleId);
	const lifetimeTypeByName = getLifetimeTypeByName(modules);

	return modules.map((module) => {
		const importedProviderGroups = getImportedProviderGroups(
			module.id,
			edges,
			moduleById,
			lifetimeTypeByName,
			selectedModuleId,
		);
		const nodeData: ModuleNodeData = {
			...module,
			globalProviderGroups,
			importedProviderGroups,
			isSelectedModule: module.id === selectedModuleId,
			lifetimeTypeByName,
			providerFocus,
			providerRelationColor:
				viewMode === "providers" &&
				selectedModuleId &&
				directDependencyIds.has(module.id)
					? getProviderGroupColor(module.id)
					: undefined,
		};

		return {
			id: module.id,
			type: "module",
			data: nodeData,
			className: getNodeClassName(nodeData, selectedModuleId, edges),
			position: { x: 0, y: 0 },
			width: viewMode === "providers" ? 380 : 260,
			height: viewMode === "providers" ? getProviderNodeHeight(nodeData) : 150,
		};
	});
}

function getProviderNodeHeight(module: ModuleNodeData): number {
	const importedProviderCount = module.importedProviderGroups.reduce(
		(count, group) => count + group.providers.length,
		0,
	);
	const sectionCount =
		1 +
		module.importedProviderGroups.filter((group) => group.providers.length > 0)
			.length;
	const providerCount = module.providers.length + importedProviderCount;

	return 118 + sectionCount * 36 + providerCount * 30;
}

function getNodeClassName(
	module: ModuleNodeData,
	selectedId: string | null | undefined,
	edges: GetGraphResponse["edges"],
) {
	const directDependencyIds = getDirectDependencyIds(edges, selectedId);
	const directDependentIds = getDirectDependentIds(edges, selectedId);

	return clsx({
		"dynamic-graph-node":
			module.familyInstanceCount > 1 || module.dynamic,
		"global-graph-node": module.kind === "global",
		"selected-graph-node": selectedId && module.id === selectedId,
		"dependency-graph-node":
			selectedId &&
			module.id !== selectedId &&
			directDependencyIds.has(module.id),
		"dependent-graph-node":
			selectedId &&
			module.id !== selectedId &&
			!directDependencyIds.has(module.id) &&
			directDependentIds.has(module.id),
		"dimmed-graph-node":
			selectedId &&
			module.id !== selectedId &&
			!directDependencyIds.has(module.id) &&
			!directDependentIds.has(module.id),
	});
}

function getDirectDependencyIds(
	edges: GetGraphResponse["edges"],
	selectedModuleId: string | null | undefined,
): Set<string> {
	return new Set(
		edges
			.filter((edge) => edge.from === selectedModuleId)
			.map((edge) => edge.to),
	);
}

function getDirectDependentIds(
	edges: GetGraphResponse["edges"],
	selectedModuleId: string | null | undefined,
): Set<string> {
	return new Set(
		edges
			.filter((edge) => edge.to === selectedModuleId)
			.map((edge) => edge.from),
	);
}
