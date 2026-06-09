import type { GetGraphResponse } from "@/api/model";

export type ProviderOccurrence = {
	id: string;
	providerKey: string;
	ownerModuleId: string;
	ownerModuleName: string;
	scopeModuleId: string;
	scopeModuleName: string;
};

export type SelectOption = {
	value: string;
	label: string;
};

export type PlaygroundGraphState = {
	graph: GetGraphResponse;
	graphError: string | null;
};
