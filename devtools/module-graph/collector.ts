import type * as Awilix from "awilix";
import {
	hasUseClass,
	type InternalModuleLike as M,
	type ModuleDecoratorMetadata,
} from "awilixify/devtools";
import type {
	GetGraphResponse,
	ModuleGraphEdge,
	ModuleGraphNode,
} from "../dtos/index.js";
import { ModuleGraphProviderCollector } from "./provider-collector.js";
import { ModuleGraphRouteCollector } from "./route-collector.js";

type ModuleGraph = GetGraphResponse;

export class ModuleGraphCollector {
	private rootModule!: M;
	private readonly modules = new Map<string, ModuleGraphNode>();
	private readonly edges = new Map<string, ModuleGraphEdge>();
	private readonly providerCollector = new ModuleGraphProviderCollector();

	private readonly routeCollector = new ModuleGraphRouteCollector({
		getModuleNode: (moduleId) => this.modules.get(moduleId),
		getOrCreateModule: (module) => this.getOrCreateModule(module),
	});

	private readonly moduleScopeByGraphId = new Map<
		string,
		Awilix.AwilixContainer
	>();
	private readonly moduleByGraphId = new Map<string, M>();

	private globalModules: readonly M[] = [];

	initialize(rootModule: M, globalModules: readonly M[]): void {
		this.rootModule = rootModule;
		this.modules.clear();
		this.edges.clear();

		this.globalModules = globalModules;

		this.moduleScopeByGraphId.clear();
		this.moduleByGraphId.clear();
	}

	registerModule({
		module,
		scope,
		importedModules,
	}: {
		module: M;
		scope: Awilix.AwilixContainer;
		importedModules: readonly M[];
	}): string {
		const id = this.getOrCreateModule(module);
		this.moduleByGraphId.set(id, module);

		if (!this.moduleScopeByGraphId.has(id)) {
			this.moduleScopeByGraphId.set(id, scope);
		}

		for (const globalModule of this.globalModules) {
			this.addEdge(module, globalModule, "global");
		}

		for (const importedModule of importedModules) {
			this.addEdge(module, importedModule, "imports");
		}

		return id;
	}

	getModule(moduleId: string): M | undefined {
		return this.moduleByGraphId.get(moduleId);
	}

	getModuleScope(moduleId: string): Awilix.AwilixContainer | undefined {
		return this.moduleScopeByGraphId.get(moduleId);
	}

	collectModuleRoutes(input: ModuleDecoratorMetadata): void {
		this.routeCollector.collectModuleRoutes(input);
	}

	getModuleGraph(): ModuleGraph {
		return {
			globalProviderGroups: [],
			modules: [...this.modules.values()],
			edges: [...this.edges.values()],
		};
	}

	private getOrCreateModule(module: M): string {
		const existingId = this.findModuleId(module);

		if (existingId) return existingId;

		const id = this.createModuleId(module);

		this.moduleByGraphId.set(id, module);
		this.modules.set(id, this.createNode(id, module));

		return id;
	}

	private addEdge(from: M, to: M, type: ModuleGraphEdge["type"]): void {
		const edge = {
			from: this.getOrCreateModule(from),
			to: this.getOrCreateModule(to),
			type,
		};
		this.edges.set(`${edge.from}:${edge.to}:${edge.type}`, edge);
	}

	private createNode(id: string, module: M): ModuleGraphNode {
		const kind =
			module === this.rootModule
				? "root"
				: this.globalModules.includes(module)
					? "global"
					: "feature";

		return {
			id,
			name: module.name,
			baseName: module.__devtools?.baseName,
			dynamic: module.__devtools?.dynamic,
			grouped: false,
			dependencyCount: 0,
			dependentCount: 0,
			familyInstanceCount: 1,
			instanceCount: 1,
			instances: [],
			kind,
			...this.providerCollector.collectProviders(module),
			exports: [...(module.exports ?? [])],
			controllers: (module.controllers ?? []).map(this.getClassName),
			queryHandlers: (module.queryHandlers ?? []).map(this.getClassName),
			commandHandlers: (module.commandHandlers ?? []).map(this.getClassName),
			queryPreHandlers: Object.keys(module.queryPreHandlers ?? {}),
			queryPreHandlerExports: [...(module.queryPreHandlerExports ?? [])],
			commandPreHandlers: Object.keys(module.commandPreHandlers ?? {}),
			commandPreHandlerExports: [...(module.commandPreHandlerExports ?? [])],
			interceptors: Object.keys(module.interceptors ?? {}),
			interceptorExports: [...(module.interceptorExports ?? [])],
			initializers: Object.keys(module.initializers ?? {}),
			initializerExports: [...(module.initializerExports ?? [])],
			routes: [],
			impact: {
				added: [],
				affected: [],
				changed: [],
				deleted: [],
			},
		};
	}

	private getClassName(value: unknown): string {
		if (typeof value === "function") return value.name || "anonymous";

		if (hasUseClass(value)) {
			return value.useClass.name || "anonymous";
		}

		return "anonymous";
	}

	private createModuleId(module: M): string {
		const baseId = this.slugify(module.name);
		let id = baseId;
		let index = 2;

		while (this.modules.has(id)) {
			id = `${baseId}-${index}`;
			index += 1;
		}

		return id;
	}

	private findModuleId(module: M): string | null {
		for (const [id, existingModule] of this.moduleByGraphId) {
			if (existingModule === module) return id;
		}

		return null;
	}

	private slugify(value: string): string {
		return value
			.trim()
			.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
			.replace(/[^a-zA-Z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.toLowerCase();
	}
}
