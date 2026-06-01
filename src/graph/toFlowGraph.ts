import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type {
  ModuleGraph,
  ModuleGraphNode,
  ProviderImpact,
  ProviderLifetime,
} from "./graph.types";

export type { ProviderLifetime } from "./graph.types";

export type ModuleNodeData = Record<string, unknown> &
  ModuleGraphNode & {
    dependencyCount: number;
    dependentCount: number;
    grouped: boolean;
    familyInstanceCount: number;
    globalProviderGroups: GlobalProviderGroup[];
    importedProviderGroups: ModuleProviderGroup[];
    instanceCount: number;
    instances: ModuleGraphNode[];
    isSelectedModule: boolean;
    providerImpact: ModuleProviderImpact;
    providerImpactStatusByName: ProviderImpactStatusByName;
    providerFocus: ProviderFocusState | null;
    onProviderFocusChange?: (
      focus: { occurrenceId: string; provider: string } | null,
    ) => void;
    providerLifetimeByName: Record<string, ProviderLifetime>;
    providerRelationColor?: string;
    searchQuery: string;
    viewMode: GraphViewMode;
  };

export type ModuleFlowNode = Node<ModuleNodeData, "module">;
export type GraphViewMode = "dependencies" | "providers";
export type ProviderFocusState = {
  dependencies: string[];
  dependants: string[];
  occurrenceId: string;
  provider: string;
};
export type GlobalProviderGroup = {
  moduleId: string;
  moduleName: string;
  providers: string[];
};
export type ModuleProviderGroup = {
  color?: string;
  exports: string[];
  impact: ModuleProviderImpact;
  moduleId: string;
  moduleName: string;
  providerAllowCircular: Record<string, boolean>;
  providerDependencies: Record<string, string[]>;
  providerEager: Record<string, boolean>;
  providerImpactStatusByName: ProviderImpactStatusByName;
  providerInitAfter: Record<string, string[]>;
  providerLifetimeByName: Record<string, ProviderLifetime>;
  providerLifetimes: Record<string, ProviderLifetime>;
  providers: string[];
};
export type ProviderImpactStatus = "affected" | "changed" | "deleted" | "new";
export type ProviderImpactStatusByName = Record<string, ProviderImpactStatus>;
export type ModuleProviderImpact = {
  affected: string[];
  added: string[];
  changed: string[];
  deleted: string[];
};
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

export type FlowGraphOptions = {
  selectedModuleId?: string | null;
  searchQuery?: string;
  showGlobalEdges?: boolean;
  showInternalModules?: boolean;
  groupDynamicModules?: boolean;
  impactOnly?: boolean;
  providerImpact?: ProviderImpact | null;
  providerFocus?: { occurrenceId: string; provider: string } | null;
  relatedOnly?: boolean;
  viewMode?: GraphViewMode;
};

export function toFlowGraph(
  graph: ModuleGraph,
  options: FlowGraphOptions = {},
): {
  nodes: ModuleFlowNode[];
  edges: ModuleFlowEdge[];
} {
  const internalVisibleModules = options.showInternalModules
    ? graph.modules
    : graph.modules.filter((module) => module.kind !== "internal");
  const globalProviderGroups = getGlobalProviderGroups(
    options.groupDynamicModules
      ? groupModules(internalVisibleModules).modules
      : toInstanceGroups(internalVisibleModules).modules,
  );
  const baseVisibleModules = options.showGlobalEdges
    ? internalVisibleModules
    : internalVisibleModules.filter((module) => module.kind !== "global");
  const grouped = options.groupDynamicModules
    ? groupModules(baseVisibleModules)
    : toInstanceGroups(baseVisibleModules);
  const groupedModules = grouped.modules;
  const sourceToVisibleId = grouped.sourceToVisibleId;
  const visibleModuleIds = new Set(baseVisibleModules.map((module) => module.id));
  const originalVisibleEdges = graph.edges.filter((edge) => edge.type !== "global").filter(
    (edge) => visibleModuleIds.has(edge.from) && visibleModuleIds.has(edge.to),
  );
  const groupedEdges = dedupeEdges(originalVisibleEdges, sourceToVisibleId);
  const providerFocus = getProviderFocusState(
    groupedModules,
    options.providerFocus,
  );
  const searchMatchedModuleIds = getSearchMatchedModuleIds(
    groupedModules,
    options.searchQuery,
  );
  const searchRelatedModuleIds = getSearchRelatedModuleIds(
    searchMatchedModuleIds,
    groupedEdges,
  );
  const relatedModuleIds = getRelatedModuleIds(
    options.selectedModuleId,
    groupedEdges,
    options.relatedOnly,
  );
  const providerFocusModuleIds = options.relatedOnly
    ? getProviderFocusModuleIds(groupedModules, providerFocus)
    : null;
  const filterModuleIds = intersectModuleIdFilters(
    searchRelatedModuleIds,
    relatedModuleIds,
    providerFocusModuleIds,
  );
  const visibleModules = filterModuleIds
    ? groupedModules.filter((module) => filterModuleIds.has(module.id))
    : groupedModules;
  const visibleEdges = filterModuleIds
    ? groupedEdges.filter(
        (edge) => filterModuleIds.has(edge.from) && filterModuleIds.has(edge.to),
      )
    : groupedEdges;
  const visibleModuleById = new Map(
    visibleModules.map((module) => [module.id, module]),
  );
  const directDependencyIds = new Set(
    visibleEdges
      .filter((edge) => edge.from === options.selectedModuleId)
      .map((edge) => edge.to),
  );
  const directDependentIds = new Set(
    visibleEdges
      .filter((edge) => edge.to === options.selectedModuleId)
      .map((edge) => edge.from),
  );
  const cycleEdgeIds = detectCycleEdgeIds(
    graph.edges.filter((edge) => edge.type === "imports"),
  );

  const viewMode = options.viewMode ?? "dependencies";
  const providerLifetimeByName = getProviderLifetimeByName(groupedModules);
  const providerImpactByModule = getProviderImpactByModule(options.providerImpact);
  const providerImpactStatusByName = getProviderImpactStatusByName(
    options.providerImpact,
  );
  const impactModuleIds = options.impactOnly
    ? getProviderImpactModuleIds(providerImpactByModule)
    : null;
  const impactVisibleModules = impactModuleIds
    ? visibleModules.filter((module) => impactModuleIds.has(module.id))
    : visibleModules;
  const impactVisibleModuleIds = new Set(
    impactVisibleModules.map((module) => module.id),
  );
  const impactVisibleEdges = impactModuleIds
    ? visibleEdges.filter(
        (edge) =>
          impactVisibleModuleIds.has(edge.from) &&
          impactVisibleModuleIds.has(edge.to),
      )
    : visibleEdges;
  const impactVisibleModuleById = new Map(
    impactVisibleModules.map((module) => [module.id, module]),
  );
  const impactDependencyCount = new Map<string, number>();
  const impactDependentCount = new Map<string, number>();

  for (const edge of impactVisibleEdges) {
    impactDependencyCount.set(
      edge.from,
      (impactDependencyCount.get(edge.from) ?? 0) + 1,
    );
    impactDependentCount.set(
      edge.to,
      (impactDependentCount.get(edge.to) ?? 0) + 1,
    );
  }

  return {
    nodes: impactVisibleModules.map((module) => {
      const importedProviderGroups = getImportedProviderGroups(
        module.id,
        impactVisibleEdges,
        impactVisibleModuleById,
        providerImpactByModule,
        providerImpactStatusByName,
        providerLifetimeByName,
        options.selectedModuleId,
      );
      const providerImpact =
        providerImpactByModule.get(module.id) ?? emptyProviderImpact();
      const nodeData: ModuleNodeData = {
        ...module,
        dependencyCount: impactDependencyCount.get(module.id) ?? 0,
        dependentCount: impactDependentCount.get(module.id) ?? 0,
        globalProviderGroups,
        importedProviderGroups,
        isSelectedModule: module.id === options.selectedModuleId,
        providerImpact,
        providerImpactStatusByName,
        providerFocus,
        providerLifetimeByName,
        providers: withDeletedProviders(module.providers, providerImpact.deleted),
        providerRelationColor:
          viewMode === "providers" &&
          options.selectedModuleId &&
          directDependencyIds.has(module.id)
            ? getProviderGroupColor(module.id)
            : undefined,
        searchQuery: options.searchQuery ?? "",
        viewMode,
      };

      return {
        id: module.id,
        type: "module",
        data: nodeData,
        className: getNodeClassName(
          nodeData,
          options.selectedModuleId,
          directDependencyIds,
          directDependentIds,
          searchMatchedModuleIds,
        ),
        position: { x: 0, y: 0 },
        width: viewMode === "providers" ? 380 : 260,
        height:
          viewMode === "providers"
            ? getProviderNodeHeight(nodeData)
            : 150,
      };
    }),
    edges: impactVisibleEdges.map((edge) => {
      const role = getEdgeRole({
        edge,
        selectedModuleId: options.selectedModuleId,
        cycleEdgeIds,
      });
      const color =
        viewMode === "providers" &&
        isFocusedDependencyEdge(edge, options.selectedModuleId)
          ? getProviderGroupColor(edge.to)
          : undefined;

      return {
        id: `${edge.from}:${edge.to}:${edge.type}`,
        source: edge.from,
        sourceHandle:
          viewMode === "providers"
            ? getProviderGroupHandleId(edge.to)
            : undefined,
        target: edge.to,
        targetHandle:
          viewMode === "providers" ? getOwnProviderGroupHandleId() : undefined,
        type: "moduleDependency",
        animated: role === "cycle" || edge.type === "global",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: color ?? getEdgeColor(role),
          width: 10,
          height: 10,
        },
        data: { color, type: edge.type, role },
        className: ["graph-edge", edge.type, role, color ? "provider-colored" : ""]
          .filter(Boolean)
          .join(" "),
      };
    }),
  };
}

function getProviderGroupColor(moduleId: string): string {
  const hue = hashString(moduleId) % 360;

  return `hsl(${hue} 72% 42%)`;
}

function hashString(value: string): number {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function getEdgeColor(role: ModuleEdgeRole): string {
  switch (role) {
    case "dependency":
      return "var(--graph-color-dependency)";
    case "dependent":
      return "var(--graph-color-dependent)";
    case "cycle":
      return "var(--graph-color-cycle)";
    case "global":
      return "var(--graph-color-global)";
    default:
      return "var(--graph-color-muted)";
  }
}

type GroupedModules = {
  modules: ModuleNodeData[];
  sourceToVisibleId: Map<string, string>;
};

function toInstanceGroups(modules: ModuleGraphNode[]): GroupedModules {
  const familyCounts = getFamilyCounts(modules);

  return {
    modules: modules.map((module) => ({
      ...module,
      grouped: false,
      familyInstanceCount: familyCounts.get(getModuleFamilyKey(module)) ?? 1,
      globalProviderGroups: [],
      importedProviderGroups: [],
      instanceCount: 1,
      instances: [module],
      isSelectedModule: false,
      providerImpact: emptyProviderImpact(),
      providerImpactStatusByName: {},
      providerFocus: null,
      providerLifetimeByName: {},
      providerRelationColor: undefined,
      searchQuery: "",
      dependencyCount: 0,
      dependentCount: 0,
      viewMode: "dependencies",
    })),
    sourceToVisibleId: new Map(modules.map((module) => [module.id, module.id])),
  };
}

function groupModules(modules: ModuleGraphNode[]): GroupedModules {
  const groups = new Map<string, ModuleGraphNode[]>();
  const sourceToVisibleId = new Map<string, string>();

  for (const module of modules) {
    const key = getModuleFamilyKey(module);
    groups.set(key, [...(groups.get(key) ?? []), module]);
  }

  const groupedModules = [...groups.entries()].map(([key, instances]) => {
    const first = instances[0];
    const id =
      instances.length > 1 || first.dynamic
        ? `group:${slugify(key)}`
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
      kind: getGroupKind(instances),
      providers: uniqueFlat(instances, "providers"),
      providerAllowCircular: mergeProviderMaps(
        instances,
        "providerAllowCircular",
      ),
      providerDependencies: mergeProviderMaps(instances, "providerDependencies"),
      providerEager: mergeProviderMaps(instances, "providerEager"),
      providerInitAfter: mergeProviderMaps(instances, "providerInitAfter"),
      providerLifetimes: mergeProviderMaps(instances, "providerLifetimes"),
      exports: uniqueFlat(instances, "exports"),
      controllers: uniqueFlat(instances, "controllers"),
      queryHandlers: uniqueFlat(instances, "queryHandlers"),
      commandHandlers: uniqueFlat(instances, "commandHandlers"),
      queryPreHandlers: uniqueFlat(instances, "queryPreHandlers"),
      commandPreHandlers: uniqueFlat(instances, "commandPreHandlers"),
      interceptors: uniqueFlat(instances, "interceptors"),
      initializers: uniqueFlat(instances, "initializers"),
      grouped: instances.length > 1,
      familyInstanceCount: instances.length,
      globalProviderGroups: [],
      importedProviderGroups: [],
      instanceCount: instances.length,
      instances,
      isSelectedModule: false,
      providerImpact: emptyProviderImpact(),
      providerImpactStatusByName: {},
      providerFocus: null,
      providerLifetimeByName: {},
      providerRelationColor: undefined,
      searchQuery: "",
      dependencyCount: 0,
      dependentCount: 0,
      viewMode: "dependencies",
    } satisfies ModuleNodeData;
  });

  return { modules: groupedModules, sourceToVisibleId };
}

function dedupeEdges(
  edges: ModuleGraph["edges"],
  sourceToVisibleId: Map<string, string>,
): ModuleGraph["edges"] {
  const byId = new Map<string, ModuleGraph["edges"][number]>();

  for (const edge of edges) {
    const from = sourceToVisibleId.get(edge.from);
    const to = sourceToVisibleId.get(edge.to);

    if (!from || !to || from === to) continue;

    const nextEdge = { ...edge, from, to };
    byId.set(`${nextEdge.from}:${nextEdge.to}:${nextEdge.type}`, nextEdge);
  }

  return [...byId.values()];
}

function getRelatedModuleIds(
  selectedModuleId: string | null | undefined,
  edges: ModuleGraph["edges"],
  relatedOnly: boolean | undefined,
): Set<string> | null {
  if (!relatedOnly || !selectedModuleId) return null;

  const relatedIds = new Set([selectedModuleId]);

  for (const edge of edges) {
    if (edge.from === selectedModuleId) {
      relatedIds.add(edge.to);
    }

    if (edge.to === selectedModuleId) {
      relatedIds.add(edge.from);
    }
  }

  return relatedIds;
}

function getSearchMatchedModuleIds(
  modules: ModuleNodeData[],
  query: string | null | undefined,
): Set<string> | null {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return null;

  return new Set(
    modules
      .filter((module) => moduleMatchesSearch(module, normalizedQuery))
      .map((module) => module.id),
  );
}

function moduleMatchesSearch(
  module: ModuleNodeData,
  normalizedQuery: string,
): boolean {
  return [
    module.name,
    module.baseName,
    ...module.providers,
    ...module.instances.flatMap((instance) => instance.providers),
  ]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

function getSearchRelatedModuleIds(
  matchedModuleIds: Set<string> | null,
  edges: ModuleGraph["edges"],
): Set<string> | null {
  if (!matchedModuleIds) return null;

  const relatedIds = new Set(matchedModuleIds);

  for (const edge of edges) {
    if (matchedModuleIds.has(edge.from)) {
      relatedIds.add(edge.to);
    }

    if (matchedModuleIds.has(edge.to)) {
      relatedIds.add(edge.from);
    }
  }

  return relatedIds;
}

function intersectModuleIdFilters(
  ...filters: Array<Set<string> | null>
): Set<string> | null {
  const activeFilters = filters.filter((filter): filter is Set<string> =>
    filter !== null,
  );
  if (activeFilters.length === 0) return null;

  const [firstFilter, ...restFilters] = activeFilters;
  return new Set(
    [...firstFilter].filter((moduleId) =>
      restFilters.every((filter) => filter.has(moduleId)),
    ),
  );
}

function getProviderImpactByModule(
  impact: ProviderImpact | null | undefined,
): Map<string, ModuleProviderImpact> {
  const byModule = new Map<string, ModuleProviderImpact>();

  for (const item of impact?.newProviders ?? []) {
    const moduleImpact = byModule.get(item.moduleId) ?? emptyProviderImpact();
    pushUnique(moduleImpact.added, item.provider);
    byModule.set(item.moduleId, moduleImpact);
  }

  for (const item of impact?.deletedProviders ?? []) {
    const moduleImpact = byModule.get(item.moduleId) ?? emptyProviderImpact();
    pushUnique(moduleImpact.deleted, item.provider);
    byModule.set(item.moduleId, moduleImpact);
  }

  for (const item of impact?.changedProviders ?? []) {
    const moduleImpact = byModule.get(item.moduleId) ?? emptyProviderImpact();
    pushUnique(moduleImpact.changed, item.provider);
    byModule.set(item.moduleId, moduleImpact);
  }

  for (const item of impact?.affectedProviders ?? []) {
    const moduleImpact = byModule.get(item.moduleId) ?? emptyProviderImpact();
    pushUnique(moduleImpact.affected, item.provider);
    byModule.set(item.moduleId, moduleImpact);
  }

  return byModule;
}

function getProviderImpactStatusByName(
  impact: ProviderImpact | null | undefined,
): ProviderImpactStatusByName {
  const byName: ProviderImpactStatusByName = {};

  for (const item of impact?.affectedProviders ?? []) {
    byName[item.provider] = "affected";
  }

  for (const item of impact?.changedProviders ?? []) {
    byName[item.provider] = "changed";
  }

  for (const item of impact?.newProviders ?? []) {
    byName[item.provider] = "new";
  }

  for (const item of impact?.deletedProviders ?? []) {
    byName[item.provider] = "deleted";
  }

  return byName;
}

function getProviderLifetimeByName(
  modules: ModuleGraphNode[],
): Record<string, ProviderLifetime> {
  const byName: Record<string, ProviderLifetime> = {};

  for (const module of modules) {
    for (const [provider, lifetime] of Object.entries(
      module.providerLifetimes ?? {},
    )) {
      byName[provider] = lifetime;
    }
  }

  return byName;
}

function getProviderFocusState(
  modules: ModuleGraphNode[],
  focus: { occurrenceId: string; provider: string } | null | undefined,
): ProviderFocusState | null {
  if (!focus) return null;

  const dependencies = new Set<string>();
  const dependants = new Set<string>();

  for (const module of modules) {
    for (const [providerName, providerDependencies] of Object.entries(
      module.providerDependencies ?? {},
    )) {
      if (providerName === focus.provider) {
        for (const dependency of providerDependencies) {
          dependencies.add(dependency);
        }
      }

      if (providerDependencies.includes(focus.provider)) {
        dependants.add(providerName);
      }
    }
  }

  return {
    dependencies: [...dependencies],
    dependants: [...dependants],
    occurrenceId: focus.occurrenceId,
    provider: focus.provider,
  };
}

function getProviderFocusModuleIds(
  modules: ModuleGraphNode[],
  providerFocus: ProviderFocusState | null,
): Set<string> | null {
  if (!providerFocus) return null;

  const relatedProviders = new Set([
    providerFocus.provider,
    ...providerFocus.dependencies,
    ...providerFocus.dependants,
  ]);

  return new Set(
    modules
      .filter((module) =>
        module.providers.some((provider) => relatedProviders.has(provider)),
      )
      .map((module) => module.id),
  );
}

function getGlobalProviderGroups(modules: ModuleGraphNode[]): GlobalProviderGroup[] {
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

function getProviderImpactModuleIds(
  providerImpactByModule: Map<string, ModuleProviderImpact>,
): Set<string> {
  return new Set(
    [...providerImpactByModule.entries()]
      .filter(([, impact]) => hasProviderImpact(impact))
      .map(([moduleId]) => moduleId),
  );
}

function hasProviderImpact(impact: ModuleProviderImpact): boolean {
  return (
    impact.added.length > 0 ||
    impact.affected.length > 0 ||
    impact.changed.length > 0 ||
    impact.deleted.length > 0
  );
}

function emptyProviderImpact(): ModuleProviderImpact {
  return {
    affected: [],
    added: [],
    changed: [],
    deleted: [],
  };
}

function pushUnique(items: string[], item: string) {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function withDeletedProviders(providers: string[], deletedProviders: string[]) {
  return [...new Set([...providers, ...deletedProviders])];
}

function getModuleFamilyKey(module: ModuleGraphNode): string {
  return module.baseName ?? module.name.replace(/_[a-f0-9]{4,}$/i, "");
}

function getImportedProviderGroups(
  moduleId: string,
  edges: ModuleGraph["edges"],
  moduleById: Map<string, ModuleNodeData>,
  providerImpactByModule: Map<string, ModuleProviderImpact>,
  providerImpactStatusByName: ProviderImpactStatusByName,
  providerLifetimeByName: Record<string, ProviderLifetime>,
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
          impact: providerImpactByModule.get(module.id) ?? emptyProviderImpact(),
          moduleId: module.id,
          moduleName: module.name,
          providerAllowCircular: module.providerAllowCircular ?? {},
          providerDependencies: module.providerDependencies ?? {},
          providerEager: module.providerEager ?? {},
          providerImpactStatusByName,
          providerInitAfter: module.providerInitAfter ?? {},
          providerLifetimeByName,
          providerLifetimes: module.providerLifetimes ?? {},
          providers: module.providers.filter((provider) =>
            module.exports.includes(provider),
          ),
        },
      ];
    });
}

function isFocusedDependencyEdge(
  edge: ModuleGraph["edges"][number],
  selectedModuleId: string | null | undefined,
): boolean {
  return Boolean(selectedModuleId && edge.from === selectedModuleId);
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

export function getProviderGroupHandleId(moduleId: string): string {
  return `provider-group:${moduleId}`;
}

export function getOwnProviderGroupHandleId(): string {
  return "provider-group:own";
}

function getFamilyCounts(modules: ModuleGraphNode[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const module of modules) {
    const key = getModuleFamilyKey(module);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function getGroupKind(instances: ModuleGraphNode[]): ModuleGraphNode["kind"] {
  if (instances.some((instance) => instance.kind === "root")) return "root";
  if (instances.every((instance) => instance.kind === "global")) return "global";
  if (instances.every((instance) => instance.kind === "internal")) return "internal";

  return "feature";
}

function uniqueFlat<Key extends keyof ModuleGraphNode>(
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

function mergeProviderMaps<
  Key extends
    | "providerAllowCircular"
    | "providerDependencies"
    | "providerEager"
    | "providerInitAfter"
    | "providerLifetimes",
>(modules: ModuleGraphNode[], key: Key): NonNullable<ModuleGraphNode[Key]> {
  return Object.assign({}, ...modules.map((module) => module[key] ?? {}));
}

function slugify(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getNodeClassName(
  module: ModuleNodeData,
  selectedId: string | null | undefined,
  directDependencyIds: Set<string>,
  directDependentIds: Set<string>,
  searchMatchedModuleIds: Set<string> | null,
) {
  const classNames = [];

  if (module.familyInstanceCount > 1 || module.dynamic) {
    classNames.push("dynamic-graph-node");
  }

  if (module.kind === "global") {
    classNames.push("global-graph-node");
  }

  if (selectedId) {
    if (module.id === selectedId) classNames.push("selected-graph-node");
    else if (directDependencyIds.has(module.id)) {
      classNames.push("dependency-graph-node");
    } else if (directDependentIds.has(module.id)) {
      classNames.push("dependent-graph-node");
    } else {
      classNames.push("dimmed-graph-node");
    }
  }

  return classNames.join(" ");
}

function getEdgeRole({
  edge,
  selectedModuleId,
  cycleEdgeIds,
}: {
  edge: ModuleGraph["edges"][number];
  selectedModuleId?: string | null;
  cycleEdgeIds: Set<string>;
}): ModuleEdgeRole {
  const edgeId = `${edge.from}:${edge.to}:${edge.type}`;

  if (cycleEdgeIds.has(edgeId)) return "cycle";
  if (edge.type === "global") return "global";
  if (edge.from === selectedModuleId) return "dependency";
  if (edge.to === selectedModuleId) return "dependent";

  return "default";
}

function detectCycleEdgeIds(edges: ModuleGraph["edges"]): Set<string> {
  const adjacency = new Map<string, string[]>();
  const cycleEdgeIds = new Set<string>();

  for (const edge of edges) {
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  }

  for (const edge of edges) {
    if (hasPath(edge.to, edge.from, adjacency, new Set())) {
      cycleEdgeIds.add(`${edge.from}:${edge.to}:${edge.type}`);
    }
  }

  return cycleEdgeIds;
}

function hasPath(
  from: string,
  to: string,
  adjacency: Map<string, string[]>,
  visited: Set<string>,
): boolean {
  if (from === to) return true;
  if (visited.has(from)) return false;

  visited.add(from);

  return (adjacency.get(from) ?? []).some((next) =>
    hasPath(next, to, adjacency, visited),
  );
}
