import type { Handler, QueryContract } from "awilixify";
import type { Deps } from "../devtools.module.js";
import type {
	ModuleGraphEdge,
	ModuleGraphGlobalProviderGroup,
	ModuleGraphNode,
	ModuleProviderImpact,
	GetGraphQuery as Payload,
	ProviderImpact,
	GetGraphResponse as Response,
} from "../dtos/index.js";

const emptyImpact: ModuleProviderImpact = {
	affected: [],
	added: [],
	changed: [],
	deleted: [],
};

export class GetModuleGraphQueryHandler
	implements Handler<GetModuleGraphQueryHandler["contract"]>
{
	static readonly key = "devtools/get-module-graph";
	declare readonly contract: QueryContract<
		typeof GetModuleGraphQueryHandler.key,
		Payload,
		Response
	>;

	constructor(
		private readonly graphCollector: Deps["graphCollector"],
		private readonly providerImpactAnalyzer: Deps["providerImpactAnalyzer"],
	) {}

	async executor(payload: Payload): Promise<Response> {
		const graph = this.graphCollector.getModuleGraph();
		const impact = await this.providerImpactAnalyzer.analyze();

		const filtered = this.filterGraph(graph, {
			groupDynamicModules: payload.groupDynamicModules,
			impactOnly: payload.impactOnly,
			relatedTo: payload.relatedTo,
			searchQuery: payload.q,
			showGlobalEdges: payload.showGlobalEdges,
			impactModuleIds: payload.impactOnly
				? this.getImpactModuleIds(impact)
				: undefined,
		});

		return this.filterRelatedGraph(
			this.shapeGraph(filtered, payload, impact),
			payload.relatedTo,
		);
	}

	private shapeGraph(
		graph: Response,
		payload: Payload,
		impact: ProviderImpact,
	): Response {
		const globalProviderGroups = this.getGlobalProviderGroups(
			payload.groupDynamicModules
				? this.groupModules(graph.modules).modules
				: this.toInstanceGroups(graph.modules).modules,
		);
		const baseVisibleModules =
			payload.showGlobalEdges !== false
				? graph.modules
				: graph.modules.filter((module) => module.kind !== "global");
		const grouped = payload.groupDynamicModules
			? this.groupModules(baseVisibleModules)
			: this.toInstanceGroups(baseVisibleModules);
		const visibleModuleIds = new Set(
			baseVisibleModules.map((module) => module.id),
		);
		const originalVisibleEdges = graph.edges
			.filter(
				(edge) =>
					payload.showGlobalEdges === undefined || edge.type !== "global",
			)
			.filter(
				(edge) =>
					visibleModuleIds.has(edge.from) && visibleModuleIds.has(edge.to),
			);
		const edges = this.dedupeEdges(
			originalVisibleEdges,
			grouped.sourceToVisibleId,
		);
		const edgeCounts = this.getEdgeCounts(edges);
		const impactByModule = this.getProviderImpactByModule(impact);

		return {
			globalProviderGroups,
			modules: grouped.modules.map((module) => ({
				...module,
				dependencyCount: edgeCounts.dependencyCount.get(module.id) ?? 0,
				dependentCount: edgeCounts.dependentCount.get(module.id) ?? 0,
				impact: impactByModule[module.id] ?? emptyImpact,
			})),
			edges,
		};
	}

	private filterGraph(
		graph: Response,
		filter: {
			groupDynamicModules?: boolean;
			impactOnly?: boolean;
			relatedTo?: string;
			searchQuery?: string;
			showGlobalEdges?: boolean;
			impactModuleIds?: Set<string>;
		},
	): Response {
		const moduleIds = this.intersectModuleIdFilters(
			this.getSearchRelatedModuleIds(
				graph.modules,
				graph.edges,
				filter.searchQuery,
			),
			filter.impactOnly ? (filter.impactModuleIds ?? new Set()) : null,
		);

		if (!moduleIds) return graph;

		const modules = graph.modules.filter((module) => moduleIds.has(module.id));

		return {
			...graph,
			modules,
			edges: graph.edges.filter(
				(edge) => moduleIds.has(edge.from) && moduleIds.has(edge.to),
			),
		};
	}

	private filterRelatedGraph(
		graph: Response,
		relatedTo: string | null | undefined,
	): Response {
		const moduleIds = this.getRelatedModuleIds(graph.edges, relatedTo);

		if (!moduleIds) return graph;

		return {
			...graph,
			modules: graph.modules.filter((module) => moduleIds.has(module.id)),
			edges: graph.edges.filter(
				(edge) => moduleIds.has(edge.from) && moduleIds.has(edge.to),
			),
		};
	}

	private toInstanceGroups(modules: ModuleGraphNode[]) {
		const familyCounts = this.getFamilyCounts(modules);

		return {
			modules: modules.map((module) => ({
				...module,
				grouped: false,
				familyInstanceCount:
					familyCounts.get(this.getModuleFamilyKey(module)) ?? 1,
				instanceCount: 1,
				instances: [module],
				dependencyCount: 0,
				dependentCount: 0,
			})),
			sourceToVisibleId: new Map(
				modules.map((module) => [module.id, module.id]),
			),
		};
	}

	private groupModules(modules: ModuleGraphNode[]) {
		const groups = new Map<string, ModuleGraphNode[]>();
		const sourceToVisibleId = new Map<string, string>();

		for (const module of modules) {
			const key = this.getModuleFamilyKey(module);
			groups.set(key, [...(groups.get(key) ?? []), module]);
		}

		const groupedModules = [...groups.entries()].map(([key, instances]) => {
			const first = instances.at(0);

			if (!first) {
				throw new Error("Cannot create a module group without modules.");
			}

			const id =
				instances.length > 1 || first.dynamic
					? `group:${this.slugify(key)}`
					: first.id;

			for (const instance of instances) {
				sourceToVisibleId.set(instance.id, id);
			}

			return {
				...first,
				id,
				name: key,
				baseName: key,
				dynamic:
					instances.length === 1
						? first.dynamic
						: {
								hash: `${instances.length} instances`,
								paramsPreview: "",
							},
				kind: this.getGroupKind(instances),
				dependencyCount: 0,
				dependentCount: 0,
				providers: this.uniqueFlat(instances, "providers"),
				providerAllowCircular: this.mergeProviderMaps(
					instances,
					"providerAllowCircular",
				),
				providerDependencies: this.mergeProviderMaps(
					instances,
					"providerDependencies",
				),
				providerEager: this.mergeProviderMaps(instances, "providerEager"),
				providerInitAfter: this.mergeProviderMaps(
					instances,
					"providerInitAfter",
				),
				lifetimeTypes: this.mergeProviderMaps(instances, "lifetimeTypes"),
				exports: this.uniqueFlat(instances, "exports"),
				controllers: this.uniqueFlat(instances, "controllers"),
				queryHandlers: this.uniqueFlat(instances, "queryHandlers"),
				commandHandlers: this.uniqueFlat(instances, "commandHandlers"),
				queryPreHandlers: this.uniqueFlat(instances, "queryPreHandlers"),
				queryPreHandlerExports: this.uniqueFlat(
					instances,
					"queryPreHandlerExports",
				),
				commandPreHandlers: this.uniqueFlat(instances, "commandPreHandlers"),
				commandPreHandlerExports: this.uniqueFlat(
					instances,
					"commandPreHandlerExports",
				),
				interceptors: this.uniqueFlat(instances, "interceptors"),
				interceptorExports: this.uniqueFlat(instances, "interceptorExports"),
				initializers: this.uniqueFlat(instances, "initializers"),
				initializerExports: this.uniqueFlat(instances, "initializerExports"),
				routes: this.uniqueRoutes(instances),
				grouped: instances.length > 1,
				familyInstanceCount: instances.length,
				instanceCount: instances.length,
				instances,
			};
		});

		return { modules: groupedModules, sourceToVisibleId };
	}

	private dedupeEdges(
		edges: ModuleGraphEdge[],
		sourceToVisibleId: Map<string, string>,
	): ModuleGraphEdge[] {
		const byId = new Map<string, ModuleGraphEdge>();

		for (const edge of edges) {
			const from = sourceToVisibleId.get(edge.from);
			const to = sourceToVisibleId.get(edge.to);

			if (!from || !to || from === to) continue;

			const nextEdge = { ...edge, from, to };
			byId.set(`${nextEdge.from}:${nextEdge.to}:${nextEdge.type}`, nextEdge);
		}

		return [...byId.values()];
	}

	private getGlobalProviderGroups(
		modules: ModuleGraphNode[],
	): ModuleGraphGlobalProviderGroup[] {
		return modules
			.filter((module) => module.kind === "global" && module.exports.length > 0)
			.map((module) => ({
				moduleId: module.id,
				moduleName: module.name,
				providers: module.providers.filter((provider) =>
					module.exports.includes(provider),
				),
			}))
			.filter((group) => group.providers.length > 0);
	}

	private getImpactModuleIds(impact: ProviderImpact): Set<string> {
		return new Set(
			[
				...impact.affectedProviders,
				...impact.changedProviders,
				...impact.deletedProviders,
				...impact.newProviders,
			].map((item) => item.moduleId),
		);
	}

	private getSearchRelatedModuleIds(
		modules: ModuleGraphNode[],
		edges: ModuleGraphEdge[],
		searchQuery: string | null | undefined,
	): Set<string> | null {
		const normalizedQuery = searchQuery?.trim().toLowerCase();

		if (!normalizedQuery) return null;

		const matchedIds = new Set(
			modules
				.filter((module) => this.moduleMatchesSearch(module, normalizedQuery))
				.map((module) => module.id),
		);

		return this.getIdsWithDirectNeighbours(edges, matchedIds);
	}

	private getRelatedModuleIds(
		edges: ModuleGraphEdge[],
		moduleId: string | null | undefined,
	): Set<string> | null {
		if (!moduleId) return null;

		return this.getIdsWithDirectNeighbours(edges, new Set([moduleId]));
	}

	private getIdsWithDirectNeighbours(
		edges: ModuleGraphEdge[],
		moduleIds: Set<string>,
	): Set<string> {
		const relatedIds = new Set(moduleIds);

		for (const edge of edges) {
			if (moduleIds.has(edge.from)) {
				relatedIds.add(edge.to);
			}

			if (moduleIds.has(edge.to)) {
				relatedIds.add(edge.from);
			}
		}

		return relatedIds;
	}

	private intersectModuleIdFilters(
		...filters: Array<Set<string> | null>
	): Set<string> | null {
		const activeFilters = filters.filter(
			(filter): filter is Set<string> => filter !== null,
		);

		if (activeFilters.length === 0) return null;

		const firstFilter = activeFilters.at(0);

		if (!firstFilter) return null;

		return new Set(
			[...firstFilter].filter((moduleId) =>
				activeFilters.slice(1).every((filter) => filter.has(moduleId)),
			),
		);
	}

	private moduleMatchesSearch(
		module: ModuleGraphNode,
		normalizedQuery: string,
	): boolean {
		return [
			module.id,
			module.name,
			module.baseName,
			...module.providers,
			...module.controllers,
			...module.routes.flatMap((route) => [
				route.method,
				route.path,
				route.controller,
				route.handler,
			]),
		]
			.filter((value): value is string => typeof value === "string")
			.some((value) => value.toLowerCase().includes(normalizedQuery));
	}

	private getModuleFamilyKey(module: ModuleGraphNode): string {
		return module.baseName ?? module.name.replace(/_[a-f0-9]{4,}$/i, "");
	}

	private getFamilyCounts(modules: ModuleGraphNode[]): Map<string, number> {
		const counts = new Map<string, number>();

		for (const module of modules) {
			const key = this.getModuleFamilyKey(module);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}

		return counts;
	}

	private getGroupKind(instances: ModuleGraphNode[]): ModuleGraphNode["kind"] {
		if (instances.some((instance) => instance.kind === "root")) return "root";
		if (instances.every((instance) => instance.kind === "global")) {
			return "global";
		}

		return "feature";
	}

	private uniqueFlat<Key extends keyof ModuleGraphNode>(
		modules: ModuleGraphNode[],
		key: Key,
	): string[] {
		return [
			...new Set(
				modules.flatMap((module) => {
					const value = module[key];

					return Array.isArray(value) ? value : [];
				}),
			),
		];
	}

	private uniqueRoutes(modules: ModuleGraphNode[]): ModuleGraphNode["routes"] {
		const routesByKey = new Map<string, ModuleGraphNode["routes"][number]>();

		for (const route of modules.flatMap((module) => module.routes ?? [])) {
			routesByKey.set(this.getRouteKey(route), route);
		}

		return [...routesByKey.values()];
	}

	private getRouteKey(route: ModuleGraphNode["routes"][number]): string {
		return `${route.method}:${route.path}:${route.controller}:${route.handler}`;
	}

	private mergeProviderMaps<
		Key extends
			| "providerAllowCircular"
			| "providerDependencies"
			| "providerEager"
			| "providerInitAfter"
			| "lifetimeTypes",
	>(modules: ModuleGraphNode[], key: Key): NonNullable<ModuleGraphNode[Key]> {
		return Object.assign({}, ...modules.map((module) => module[key] ?? {}));
	}

	private slugify(value: string): string {
		return value
			.trim()
			.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
			.replace(/[^a-zA-Z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.toLowerCase();
	}

	private getEdgeCounts(edges: ModuleGraphEdge[]): {
		dependencyCount: Map<string, number>;
		dependentCount: Map<string, number>;
	} {
		const dependencyCount = new Map<string, number>();
		const dependentCount = new Map<string, number>();

		for (const edge of edges) {
			dependencyCount.set(edge.from, (dependencyCount.get(edge.from) ?? 0) + 1);
			dependentCount.set(edge.to, (dependentCount.get(edge.to) ?? 0) + 1);
		}

		return { dependencyCount, dependentCount };
	}

	private getProviderImpactByModule(
		impact: ProviderImpact,
	): Record<string, ModuleProviderImpact> {
		const byModule: Record<string, ModuleProviderImpact> = {};

		const getOrCreate = (moduleId: string): ModuleProviderImpact => {
			if (!byModule[moduleId]) {
				byModule[moduleId] = {
					affected: [],
					added: [],
					changed: [],
					deleted: [],
				};
			}

			return byModule[moduleId];
		};

		const pushUnique = (items: string[], item: string) => {
			if (!items.includes(item)) {
				items.push(item);
			}
		};

		for (const item of impact.newProviders) {
			pushUnique(getOrCreate(item.moduleId).added, item.provider);
		}

		for (const item of impact.deletedProviders) {
			pushUnique(getOrCreate(item.moduleId).deleted, item.provider);
		}

		for (const item of impact.changedProviders) {
			pushUnique(getOrCreate(item.moduleId).changed, item.provider);
		}

		for (const item of impact.affectedProviders) {
			pushUnique(getOrCreate(item.moduleId).affected, item.provider);
		}

		return byModule;
	}
}
