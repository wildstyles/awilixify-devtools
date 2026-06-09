import { useMemo } from "react";

import type { GetGraphResponse } from "@/api/model";
import { useGetDevtoolsGraph } from "@/api/graph/graph";
import { useGraphSettings } from "../GraphSettingsContext.js";

export function useModuleGraphData(): {
	error: string | null;
	graph: GetGraphResponse | null;
	loading: boolean;
} {
	const {
		groupDynamicModules,
		impactOnly,
		searchQuery,
		selectedModuleId,
		showGlobalEdges,
		showRelatedOnly,
	} = useGraphSettings();
	const graphRequest = useMemo(
		() => ({
			groupDynamicModules,
			impactOnly,
			relatedTo:
				showRelatedOnly && selectedModuleId ? selectedModuleId : undefined,
			searchQuery,
			showGlobalEdges,
		}),
		[
			groupDynamicModules,
			impactOnly,
			searchQuery,
			selectedModuleId,
			showGlobalEdges,
			showRelatedOnly,
		],
	);

	const graphQuery = useGetDevtoolsGraph(graphRequest, {
		query: { refetchOnMount: true },
	});

	return {
		error: graphQuery.error
			? graphQuery.error instanceof Error
				? graphQuery.error.message
				: String(graphQuery.error)
			: null,
		graph: graphQuery.data ?? null,
		loading: graphQuery.isLoading || graphQuery.isFetching,
	};
}
