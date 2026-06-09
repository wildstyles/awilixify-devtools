import type { Handler, QueryContract } from "awilixify";
import type { Deps } from "../devtools.module.js";
import type { GetTracesResponse as Response } from "../dtos/index.js";

type Payload = Record<string, never>;

export class GetTracesQueryHandler
	implements Handler<GetTracesQueryHandler["contract"]>
{
	static readonly key = "devtools/get-traces";
	declare readonly contract: QueryContract<
		typeof GetTracesQueryHandler.key,
		Payload,
		Response
	>;

	constructor(private readonly tracer: Deps["tracer"]) {}

	async executor(): Promise<Response> {
		return this.tracer.getTraces();
	}
}
