import type {
	GetGraphResponse,
	ModuleGraphNode,
	LifetimeType,
} from "@/api/model";
import type { ModuleProviderGroup } from "../types";

type LifetimeTypeRecord = Record<string, LifetimeType>;

export function getProviderGroupColor(moduleId: string): string {
	const hue = hashString(moduleId) % 360;
	return `hsl(${hue} 72% 42%)`;
}

export function getImportedProviderGroups(
	moduleId: string,
	edges: GetGraphResponse["edges"],
	moduleById: Map<string, ModuleGraphNode>,
	lifetimeTypeByName: Record<string, LifetimeType>,
	selectedModuleId: string | null | undefined,
): ModuleProviderGroup[] {
	return edges
		.filter((edge) => edge.from === moduleId)
		.flatMap((edge) => {
			const module = moduleById.get(edge.to);

			if (!module || module.exports.length === 0) return [];

			return [
				{
					color: isFocusedDependencyEdge(edge, selectedModuleId)
						? getProviderGroupColor(module.id)
						: undefined,
					exports: module.exports,
					moduleId: module.id,
					moduleName: module.name,
					providerAllowCircular: module.providerAllowCircular ?? {},
					providerDependencies: module.providerDependencies ?? {},
					providerEager: module.providerEager ?? {},
					providerInitAfter: module.providerInitAfter ?? {},
					lifetimeTypeByName,
					lifetimeTypes: (module.lifetimeTypes ?? {}) as LifetimeTypeRecord,
					providers: module.providers.filter((provider) =>
						module.exports.includes(provider),
					),
					impact: module.impact,
				},
			];
		});
}

export function getLifetimeTypeByName(
	modules: ModuleGraphNode[],
): LifetimeTypeRecord {
	const byName: LifetimeTypeRecord = {};

	for (const module of modules) {
		for (const [provider, lifetime] of Object.entries(
			module.lifetimeTypes ?? {},
		)) {
			byName[provider] = lifetime as LifetimeType;
		}
	}

	return byName;
}

export function isFocusedDependencyEdge(
	edge: GetGraphResponse["edges"][number],
	selectedModuleId: string | null | undefined,
): boolean {
	return Boolean(selectedModuleId && edge.from === selectedModuleId);
}

function hashString(value: string): number {
	let hash = 0;

	for (const character of value) {
		hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
	}

	return hash;
}
