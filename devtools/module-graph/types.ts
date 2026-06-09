// Re-export types from DTOs for backwards compatibility
export type {
	GetGraphResponse as ModuleGraph,
	GetModuleDetailsResponse as ModuleGraphModuleDetails,
	ModuleGraphEdge,
	ModuleGraphGlobalProviderGroup,
	ModuleGraphNode,
	ModuleGraphRoute,
} from "../dtos/index.js";
