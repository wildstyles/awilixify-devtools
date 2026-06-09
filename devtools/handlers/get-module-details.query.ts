import type { Handler, QueryContract } from "awilixify";
import type { Deps } from "../devtools.module.js";
import type {
	GetModuleDetailsResponse,
	ModuleGraphNode,
	GetModuleDetailsParams as Payload,
} from "../dtos/index.js";

type Response = GetModuleDetailsResponse | null;

export class GetModuleDetailsQueryHandler
	implements Handler<GetModuleDetailsQueryHandler["contract"]>
{
	static readonly key = "devtools/get-module-details";
	declare readonly contract: QueryContract<
		typeof GetModuleDetailsQueryHandler.key,
		Payload,
		Response
	>;

	constructor(private readonly graphCollector: Deps["graphCollector"]) {}

	async executor(payload: Payload): Promise<Response> {
		const graph = this.graphCollector.getModuleGraph();
		const module = this.findModuleNode(graph.modules, payload.moduleId);

		if (!module) return null;

		const importEdges = graph.edges.filter(
			(edge) => edge.from === module.id && edge.type === "imports",
		);
		const importedModules = importEdges
			.map((edge) => graph.modules.find((m) => m.id === edge.to))
			.filter((node): node is ModuleGraphNode => Boolean(node));
		const globalModules = graph.modules.filter(
			(node) => node.kind === "global",
		);
		const usedByModules = graph.edges
			.filter((edge) => edge.to === module.id)
			.map(
				(edge) =>
					graph.modules.find((m) => m.id === edge.from)?.name ?? edge.from,
			);

		return {
			availableCommandPreHandlers: this.unique([
				...module.commandPreHandlers,
				...importedModules.flatMap((node) => node.commandPreHandlerExports),
				...globalModules.flatMap((node) => node.commandPreHandlerExports),
			]),
			availableInitializers: this.unique([
				...module.initializers,
				...importedModules.flatMap((node) => node.initializerExports),
				...globalModules.flatMap((node) => node.initializerExports),
			]),
			availableInterceptors: this.unique([
				...module.interceptors,
				...importedModules.flatMap((node) => node.interceptorExports),
				...globalModules.flatMap((node) => node.interceptorExports),
			]),
			availableQueryPreHandlers: this.unique([
				...module.queryPreHandlers,
				...importedModules.flatMap((node) => node.queryPreHandlerExports),
				...globalModules.flatMap((node) => node.queryPreHandlerExports),
			]),
			globalModules: globalModules.map((node) => node.name),
			importedModules: importEdges.map(
				(edge) => graph.modules.find((m) => m.id === edge.to)?.name ?? edge.to,
			),
			module,
			routes: module.routes,
			usedByModules,
		};
	}

	private findModuleNode(
		modules: ModuleGraphNode[],
		moduleIdOrName: string,
	): ModuleGraphNode | null {
		return (
			modules.find((module) => module.id === moduleIdOrName) ??
			modules.find((module) => module.name === moduleIdOrName) ??
			null
		);
	}

	private unique(items: string[]): string[] {
		return [...new Set(items)];
	}
}
