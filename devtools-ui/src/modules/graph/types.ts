import type { Edge, Node } from "@xyflow/react";
import type { LifetimeType } from "awilix";
import type {
	ModuleGraphGlobalProviderGroup,
	ModuleGraphNode,
	ModuleProviderImpact,
} from "@/api/model";

export type ModuleNodeData = ModuleGraphNode & {
	globalProviderGroups: ModuleGraphGlobalProviderGroup[];
	importedProviderGroups: ModuleProviderGroup[];
	isSelectedModule: boolean;
	lifetimeTypeByName: Record<string, LifetimeType>;
	providerFocus: ProviderFocusState;
	providerRelationColor?: string;
	[key: string]: unknown;
};

export type ModuleFlowNode = Node<ModuleNodeData, "module">;

export type GraphViewMode = "dependencies" | "providers";

export type ProviderFocusState = {
	dependencies: string[];
	dependants: string[];
	occurrenceId: string;
	provider: string;
};

export type ModuleProviderGroup = {
	color?: string;
	exports: string[];
	moduleId: string;
	moduleName: string;
	providerAllowCircular: Record<string, boolean>;
	providerDependencies: Record<string, string[]>;
	providerEager: Record<string, boolean>;
	providerInitAfter: Record<string, string[]>;
	lifetimeTypeByName: Record<string, LifetimeType>;
	lifetimeTypes: Record<string, LifetimeType>;
	providers: string[];
	impact: ModuleProviderImpact;
};

export type ProviderImpactStatusByName = Record<
	string,
	"affected" | "changed" | "new" | "deleted"
>;

export type ModuleEdgeRole =
	| "dependency"
	| "dependent"
	| "cycle"
	| "global"
	| "default";

export type ModuleFlowEdge = Edge<{
	color?: string;
	type: "imports" | "global";
	path?: string;
	role: ModuleEdgeRole;
}>;

export type ProviderFocusInput = {
	occurrenceId: string;
	provider: string;
} | null;
