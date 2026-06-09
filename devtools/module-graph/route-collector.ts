import { resolveDecoratorState } from "awilixify";
import {
	getControllerMethodNames,
	type InternalModuleLike as M,
	type ModuleDecoratorMetadata,
} from "awilixify/devtools";
import {
	HTTP_DECORATOR_STATE_TOKEN,
	type RouteSchema,
	rollUpHttpDecoratorState,
} from "awilixify/http";
import type { ModuleGraphNode, ModuleGraphRoute } from "./types.js";

type ModuleGraphRouteCollectorOptions = {
	getOrCreateModule(module: M): string;
	getModuleNode(moduleId: string): ModuleGraphNode | undefined;
};

export class ModuleGraphRouteCollector {
	constructor(private readonly options: ModuleGraphRouteCollectorOptions) {}

	collectModuleRoutes({
		module,
		controllers,
		initializers,
	}: ModuleDecoratorMetadata): void {
		for (const { controllerClass: controller } of controllers) {
			for (const methodName of getControllerMethodNames(controller)) {
				for (const [, resolveInitializer] of initializers) {
					const initializer = resolveInitializer();
					const decoratorState = resolveDecoratorState(
						controller,
						initializer.token,
					);

					if (decoratorState === null) continue;

					const metadata = decoratorState.methods.get(methodName);

					if (metadata === undefined) continue;
					if (
						initializer.token.stateSymbol.description !==
						HTTP_DECORATOR_STATE_TOKEN.stateSymbol.description
					)
						continue;

					const httpState = rollUpHttpDecoratorState(
						decoratorState.root,
						metadata,
					);

					for (const method of httpState.verbs) {
						for (const path of httpState.paths) {
							this.addRoute(module, {
								method,
								path,
								controller: controller.name,
								handler: String(methodName),
								schema: this.getRequestSchema(httpState.schema),
							});
						}
					}
				}
			}
		}
	}

	private addRoute(module: M, route: ModuleGraphRoute): void {
		const id = this.options.getOrCreateModule(module);
		const node = this.options.getModuleNode(id);

		if (!node) return;

		const routeKey = this.getRouteKey(route);
		if (
			node.routes.some((existing) => this.getRouteKey(existing) === routeKey)
		) {
			return;
		}

		node.routes.push(route);
	}

	private getRouteKey(route: ModuleGraphRoute): string {
		return `${route.method}:${route.path}:${route.controller}:${route.handler}`;
	}

	private getRequestSchema(schema: RouteSchema): ModuleGraphRoute["schema"] {
		const requestSchema = {
			...(schema.body ? { body: schema.body } : {}),
			...(schema.headers ? { headers: schema.headers } : {}),
			...(schema.params ? { params: schema.params } : {}),
			...(schema.querystring ? { querystring: schema.querystring } : {}),
		};

		return Object.keys(requestSchema).length > 0 ? requestSchema : undefined;
	}
}
