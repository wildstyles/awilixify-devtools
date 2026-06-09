import { GET, POST, schema } from "awilixify/http";
import type { Deps } from "./devtools.module.js";
import {
	GetGraphSchema,
	GetModuleDetailsSchema,
	GetProviderImpactSchema,
	GetProviderMethodsSchema,
	GetTraceSchema,
	GetTracesSchema,
	InvokeProviderSchema,
} from "./dtos/index.js";
import type { Request } from "./types.js";

export class DevtoolsApiController {
	constructor(
		private readonly queryMediator: Deps["queryMediator"],
		private readonly commandMediator: Deps["commandMediator"],
	) {}

	@GET("/graph")
	@schema(GetGraphSchema)
	getModuleGraph(request: Request<typeof GetGraphSchema>) {
		return this.queryMediator.execute(
			"devtools/get-module-graph",
			request.query,
		);
	}

	@GET("/graph/modules/:moduleId")
	@schema(GetModuleDetailsSchema)
	getModuleDetails(request: Request<typeof GetModuleDetailsSchema>) {
		return this.queryMediator.execute(
			"devtools/get-module-details",
			request.params,
		);
	}

	@GET("/traces")
	@schema(GetTracesSchema)
	getTraces() {
		return this.queryMediator.execute("devtools/get-traces", {});
	}

	@GET("/traces/:traceId")
	@schema(GetTraceSchema)
	getTrace(request: Request<typeof GetTraceSchema>) {
		return this.queryMediator.execute("devtools/get-trace", request.params);
	}

	@GET("/playground/methods")
	@schema(GetProviderMethodsSchema)
	getProviderMethods(request: Request<typeof GetProviderMethodsSchema>) {
		return this.queryMediator.execute(
			"devtools/get-provider-methods",
			request.query,
		);
	}

	@POST("/playground/invoke")
	@schema(InvokeProviderSchema)
	invokeProvider(request: Request<typeof InvokeProviderSchema>) {
		return this.commandMediator.execute(
			"devtools/invoke-provider",
			request.body,
		);
	}

	@GET("/impact")
	@schema(GetProviderImpactSchema)
	getProviderImpact() {
		return this.queryMediator.execute("devtools/get-provider-impact", {});
	}
}
