import { type Static, Type } from "@sinclair/typebox";
import {
	ModuleGraphNodeSchema,
	ModuleGraphRouteSchema,
} from "./get-graph.dto.js";

export const GetModuleDetailsParamsSchema = Type.Object(
	{
		moduleId: Type.String(),
	},
	{ $id: "GetModuleDetailsParams" },
);

export type GetModuleDetailsParams = Static<
	typeof GetModuleDetailsParamsSchema
>;

export const GetModuleDetailsResponseSchema = Type.Object(
	{
		availableCommandPreHandlers: Type.Array(Type.String()),
		availableInitializers: Type.Array(Type.String()),
		availableInterceptors: Type.Array(Type.String()),
		availableQueryPreHandlers: Type.Array(Type.String()),
		globalModules: Type.Array(Type.String()),
		importedModules: Type.Array(Type.String()),
		module: ModuleGraphNodeSchema,
		routes: Type.Array(ModuleGraphRouteSchema),
		usedByModules: Type.Array(Type.String()),
	},
	{ $id: "GetModuleDetailsResponse" },
);

export type GetModuleDetailsResponse = Static<
	typeof GetModuleDetailsResponseSchema
>;

export const GetModuleDetailsSchema = {
	params: GetModuleDetailsParamsSchema,
	response: {
		200: GetModuleDetailsResponseSchema,
	},
	tags: ["Graph"],
	summary: "Get module details",
	description: "Returns detailed information about a specific module",
};
