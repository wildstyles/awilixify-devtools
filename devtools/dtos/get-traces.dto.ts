import { type Static, Type } from "@sinclair/typebox";
import { TraceSchema } from "./trace.dto.js";

export const GetTracesResponseSchema = Type.Array(TraceSchema, {
	$id: "GetTracesResponse",
});

export type GetTracesResponse = Static<typeof GetTracesResponseSchema>;

export const GetTracesSchema = {
	response: {
		200: GetTracesResponseSchema,
	},
	tags: ["Traces"],
	summary: "Get all traces",
	description: "Returns all HTTP request traces",
};
