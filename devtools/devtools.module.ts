import { createModule, type ModuleDef } from "awilixify";
import { AWILIXIFY_DEVTOOLS_PROCESSOR } from "awilixify/devtools";
import Fastify, { type FastifyInstance } from "fastify";

import { DevtoolsApiController } from "./devtools-api.controller.js";
import { DevtoolsHttpInitializer } from "./devtools-http.initializer.js";
import { DevtoolsProcessor } from "./devtools-processor.js";
import { DevtoolsServer } from "./devtools-server.js";
import {
	GetModuleDetailsQueryHandler,
	GetModuleGraphQueryHandler,
	GetProviderImpactQueryHandler,
	GetProviderMethodsQueryHandler,
	GetTraceQueryHandler,
	GetTracesQueryHandler,
	InvokeProviderCommandHandler,
} from "./handlers/index.js";
import { ModuleGraphCollector } from "./module-graph/collector.js";
import { ProviderImpactAnalyzer } from "./provider-impact/analyzer.js";
import { Tracer } from "./trace/tracer.js";

type Options = {
	host?: string;
	port?: number;
	/** URL of the real app to proxy non-devtools requests to (e.g., "http://localhost:3000") */
	appUrl?: string;
	ui?:
		| false
		| {
				host?: string;
				port?: number;
		  };
};

export type DevtoolsModuleDef = ModuleDef<{
	providers: {
		options: Options;
		fastify: FastifyInstance;
		graphCollector: ModuleGraphCollector;
		providerImpactAnalyzer: ProviderImpactAnalyzer;
		[AWILIXIFY_DEVTOOLS_PROCESSOR]: DevtoolsProcessor;
		devtoolsServer: DevtoolsServer;
		tracer: Tracer;
	};
	queryHandlers: [
		GetModuleGraphQueryHandler,
		GetModuleDetailsQueryHandler,
		GetTracesQueryHandler,
		GetTraceQueryHandler,
		GetProviderMethodsQueryHandler,
		GetProviderImpactQueryHandler,
	];
	commandHandlers: [InvokeProviderCommandHandler];
	initializers: {
		http: typeof DevtoolsHttpInitializer;
	};
}>;

export type Deps = DevtoolsModuleDef["deps"];

export const DevtoolsModule = (options: Options = {}) => {
	return createModule<DevtoolsModuleDef>({
		name: "DevtoolsModule",
		controllers: [DevtoolsApiController],
		providers: {
			options,
			fastify: {
				useFactory: () =>
					Fastify({
						logger: true,
					}),
			},
			graphCollector: ModuleGraphCollector,
			providerImpactAnalyzer: ProviderImpactAnalyzer,
			tracer: Tracer,
			[AWILIXIFY_DEVTOOLS_PROCESSOR]: {
				useClass: DevtoolsProcessor,
			},
			devtoolsServer: {
				useClass: DevtoolsServer,
				eager: true,
			},
		},
		queryHandlers: [
			GetModuleGraphQueryHandler,
			GetModuleDetailsQueryHandler,
			GetTracesQueryHandler,
			GetTraceQueryHandler,
			GetProviderMethodsQueryHandler,
			GetProviderImpactQueryHandler,
		],
		commandHandlers: [InvokeProviderCommandHandler],
		initializers: {
			http: DevtoolsHttpInitializer,
		},
	});
};
