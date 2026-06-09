import { type Static, Type } from "@sinclair/typebox";

export const GetGraphQuerySchema = Type.Object(
	{
		groupDynamicModules: Type.Optional(Type.Boolean()),
		impactOnly: Type.Optional(Type.Boolean()),
		q: Type.Optional(Type.String()),
		relatedTo: Type.Optional(Type.String()),
		showGlobalEdges: Type.Optional(Type.Boolean()),
	},
	{ $id: "GetGraphQuery" },
);

export type GetGraphQuery = Static<typeof GetGraphQuerySchema>;

export const RouteSchemaSchema = Type.Object(
	{
		body: Type.Optional(Type.Any()),
		querystring: Type.Optional(Type.Any()),
		params: Type.Optional(Type.Any()),
		headers: Type.Optional(Type.Any()),
	},
	{ $id: "RouteSchema" },
);

export type RouteSchema = Static<typeof RouteSchemaSchema>;

export const ModuleGraphRouteSchema = Type.Object(
	{
		method: Type.String(),
		path: Type.String(),
		controller: Type.String(),
		handler: Type.String(),
		schema: Type.Optional(RouteSchemaSchema),
	},
	{ $id: "ModuleGraphRoute" },
);

export type ModuleGraphRoute = Static<typeof ModuleGraphRouteSchema>;

const DynamicModuleInfoSchema = Type.Object(
	{
		hash: Type.String(),
		paramsPreview: Type.String(),
	},
	{ $id: "DynamicModuleInfo" },
);

const ModuleGraphNodeKindSchema = Type.Union(
	[Type.Literal("root"), Type.Literal("global"), Type.Literal("feature")],
	{ $id: "ModuleGraphNodeKind" },
);

const LifetimeTypeSchema = Type.Union(
	[
		Type.Literal("SINGLETON"),
		Type.Literal("SCOPED"),
		Type.Literal("TRANSIENT"),
	],
	{ $id: "LifetimeType" },
);

// Base node schema without instances (used for nested instances to avoid recursive $ref)
const ModuleGraphNodeBaseSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		baseName: Type.Optional(Type.String()),
		dynamic: Type.Optional(DynamicModuleInfoSchema),
		grouped: Type.Boolean(),
		familyInstanceCount: Type.Number(),
		instanceCount: Type.Number(),
		kind: ModuleGraphNodeKindSchema,
		dependencyCount: Type.Number(),
		dependentCount: Type.Number(),
		providers: Type.Array(Type.String()),
		providerAllowCircular: Type.Record(Type.String(), Type.Boolean()),
		providerDependencies: Type.Record(Type.String(), Type.Array(Type.String())),
		providerEager: Type.Record(Type.String(), Type.Boolean()),
		providerInitAfter: Type.Record(Type.String(), Type.Array(Type.String())),
		lifetimeTypes: Type.Record(Type.String(), LifetimeTypeSchema),
		exports: Type.Array(Type.String()),
		controllers: Type.Array(Type.String()),
		queryHandlers: Type.Array(Type.String()),
		commandHandlers: Type.Array(Type.String()),
		queryPreHandlers: Type.Array(Type.String()),
		queryPreHandlerExports: Type.Array(Type.String()),
		commandPreHandlers: Type.Array(Type.String()),
		commandPreHandlerExports: Type.Array(Type.String()),
		interceptors: Type.Array(Type.String()),
		interceptorExports: Type.Array(Type.String()),
		initializers: Type.Array(Type.String()),
		initializerExports: Type.Array(Type.String()),
	},
	{ $id: "ModuleGraphNodeBase" },
);

export const ModuleProviderImpactSchema = Type.Object(
	{
		affected: Type.Array(Type.String()),
		added: Type.Array(Type.String()),
		changed: Type.Array(Type.String()),
		deleted: Type.Array(Type.String()),
	},
	{ $id: "ModuleProviderImpact" },
);

export type ModuleProviderImpact = Static<typeof ModuleProviderImpactSchema>;

export const ModuleGraphNodeSchema = Type.Composite(
	[
		ModuleGraphNodeBaseSchema,
		Type.Object({
			routes: Type.Array(ModuleGraphRouteSchema),
			instances: Type.Array(ModuleGraphNodeBaseSchema),
			impact: ModuleProviderImpactSchema,
		}),
	],
	{ $id: "ModuleGraphNode" },
);

export type ModuleGraphNode = Static<typeof ModuleGraphNodeSchema>;

export const ModuleGraphGlobalProviderGroupSchema = Type.Object(
	{
		moduleId: Type.String(),
		moduleName: Type.String(),
		providers: Type.Array(Type.String()),
	},
	{ $id: "ModuleGraphGlobalProviderGroup" },
);

export type ModuleGraphGlobalProviderGroup = Static<
	typeof ModuleGraphGlobalProviderGroupSchema
>;

export const ModuleGraphEdgeSchema = Type.Object(
	{
		from: Type.String(),
		to: Type.String(),
		type: Type.Union([Type.Literal("imports"), Type.Literal("global")]),
	},
	{ $id: "ModuleGraphEdge" },
);

export type ModuleGraphEdge = Static<typeof ModuleGraphEdgeSchema>;

export const GetGraphResponseSchema = Type.Object(
	{
		globalProviderGroups: Type.Array(ModuleGraphGlobalProviderGroupSchema),
		modules: Type.Array(ModuleGraphNodeSchema),
		edges: Type.Array(ModuleGraphEdgeSchema),
	},
	{ $id: "GetGraphResponse" },
);

export type GetGraphResponse = Static<typeof GetGraphResponseSchema>;

export const GetGraphSchema = {
	querystring: GetGraphQuerySchema,
	response: {
		200: GetGraphResponseSchema,
	},
	tags: ["Graph"],
	summary: "Get module graph",
	description: "Returns the module dependency graph with optional filtering",
};
