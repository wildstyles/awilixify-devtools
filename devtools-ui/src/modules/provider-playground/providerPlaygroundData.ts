import type { GetGraphResponse, ModuleGraphNode } from "@/api/model";
import type { ProviderOccurrence, SelectOption } from "./types";

export function getProviderOccurrences(
	graph: GetGraphResponse,
): ProviderOccurrence[] {
	const moduleById = new Map(
		graph.modules.map((module) => [module.id, module]),
	);
	const occurrences: ProviderOccurrence[] = [];

	for (const scopeModule of graph.modules) {
		for (const providerKey of scopeModule.providers) {
			occurrences.push(
				createProviderOccurrence({
					providerKey,
					ownerModule: scopeModule,
					scopeModule,
				}),
			);
		}

		const outgoing = graph.edges.filter((edge) => edge.from === scopeModule.id);

		for (const edge of outgoing) {
			const ownerModule = moduleById.get(edge.to);
			if (!ownerModule) continue;

			for (const providerKey of ownerModule.exports) {
				occurrences.push(
					createProviderOccurrence({
						providerKey,
						ownerModule,
						scopeModule,
					}),
				);
			}
		}
	}

	return dedupeProviderOccurrences(occurrences).sort((a, b) =>
		formatOccurrenceSortKey(a).localeCompare(formatOccurrenceSortKey(b)),
	);
}

export function getModuleOptions(
	graph: GetGraphResponse,
	providers: ProviderOccurrence[],
	selectedProviderKey: string | null,
): SelectOption[] {
	const availableModuleIds = selectedProviderKey
		? new Set(
				providers
					.filter((provider) => provider.providerKey === selectedProviderKey)
					.map((provider) => provider.scopeModuleId),
			)
		: null;

	return graph.modules
		.filter(
			(module) => !availableModuleIds || availableModuleIds.has(module.id),
		)
		.map((module) => ({
			value: module.id,
			label: module.name,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
}

export function getProviderOptions(
	providers: ProviderOccurrence[],
	selectedScopeModuleId: string | null,
): SelectOption[] {
	const filteredProviders = selectedScopeModuleId
		? providers.filter(
				(provider) => provider.scopeModuleId === selectedScopeModuleId,
			)
		: providers;
	const providerByKey = new Map<string, ProviderOccurrence[]>();

	for (const provider of filteredProviders) {
		providerByKey.set(provider.providerKey, [
			...(providerByKey.get(provider.providerKey) ?? []),
			provider,
		]);
	}

	return [...providerByKey.keys()]
		.map((providerKey) => ({
			value: providerKey,
			label: providerKey,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
}

export function getSelectedProviderOccurrence(
	providers: ProviderOccurrence[],
	selectedScopeModuleId: string | null,
	selectedProviderKey: string | null,
): ProviderOccurrence | null {
	if (!selectedScopeModuleId || !selectedProviderKey) return null;

	return (
		providers.find(
			(provider) =>
				provider.scopeModuleId === selectedScopeModuleId &&
				provider.providerKey === selectedProviderKey,
		) ?? null
	);
}

function createProviderOccurrence({
	providerKey,
	ownerModule,
	scopeModule,
}: {
	providerKey: string;
	ownerModule: ModuleGraphNode;
	scopeModule: ModuleGraphNode;
}): ProviderOccurrence {
	return {
		id: `${scopeModule.id}:${ownerModule.id}:${providerKey}`,
		providerKey,
		ownerModuleId: ownerModule.id,
		ownerModuleName: ownerModule.name,
		scopeModuleId: scopeModule.id,
		scopeModuleName: scopeModule.name,
	};
}

function dedupeProviderOccurrences(
	occurrences: ProviderOccurrence[],
): ProviderOccurrence[] {
	const byId = new Map<string, ProviderOccurrence>();

	for (const occurrence of occurrences) {
		byId.set(occurrence.id, occurrence);
	}

	return [...byId.values()];
}

function formatOccurrenceSortKey(provider: ProviderOccurrence): string {
	return `${provider.scopeModuleName}.${provider.providerKey}.${provider.ownerModuleName}`;
}
