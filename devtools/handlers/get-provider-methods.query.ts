import type { Constructor } from "awilix";

import type { Handler, QueryContract } from "awilixify";
import { hasUseClass, isConstructorProvider } from "awilixify/devtools";
import type { Deps } from "../devtools.module.js";
import type {
	GetProviderMethodsQuery as Payload,
	GetProviderMethodsResponse as Response,
} from "../dtos/index.js";

export class GetProviderMethodsQueryHandler
	implements Handler<GetProviderMethodsQueryHandler["contract"]>
{
	static readonly key = "devtools/get-provider-methods";
	declare readonly contract: QueryContract<
		typeof GetProviderMethodsQueryHandler.key,
		Payload,
		Response
	>;

	constructor(private readonly graphCollector: Deps["graphCollector"]) {}

	async executor(payload: Payload): Promise<Response> {
		const graph = this.graphCollector.getModuleGraph();
		const scopeModule = this.graphCollector.getModule(payload.scopeModuleId);

		const providerDefinition = scopeModule?.providers?.[payload.providerKey]
			? scopeModule.providers[payload.providerKey]
			: graph.edges
					.filter((edge) => edge.from === payload.scopeModuleId)
					.map((edge) => this.graphCollector.getModule(edge.to))
					.find((module) => module?.exports?.includes(payload.providerKey))
					?.providers?.[payload.providerKey];

		const useClass = this.getProviderClass(providerDefinition);

		return {
			methods: (useClass
				? this.getTargetMethodNames(useClass.prototype)
				: []
			).sort((a, b) => a.localeCompare(b)),
		};
	}

	private getProviderClass(
		providerDefinition: unknown,
	): Constructor<object> | null {
		if (isConstructorProvider(providerDefinition)) {
			return providerDefinition;
		}

		if (hasUseClass(providerDefinition)) {
			return providerDefinition.useClass;
		}

		return null;
	}

	private getTargetMethodNames(target: object): string[] {
		return Object.getOwnPropertyNames(target).filter(
			(name) =>
				name !== "constructor" &&
				typeof (target as Record<string, unknown>)[name] === "function",
		);
	}
}
