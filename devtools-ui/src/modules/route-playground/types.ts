export type RoutePlaygroundResponse = {
	body: unknown;
	headers: Record<string, string>;
	ok: boolean;
	status: number;
	statusText: string;
};

export const RoutePlaygroundViewModes = {
	trace: "trace",
	graph: "graph",
	response: "response",
} as const;

export type RoutePlaygroundViewMode =
	(typeof RoutePlaygroundViewModes)[keyof typeof RoutePlaygroundViewModes];

export const viewModeOptions: { label: string; value: RoutePlaygroundViewMode }[] = [
	{ label: "Trace", value: RoutePlaygroundViewModes.trace },
	{ label: "Graph", value: RoutePlaygroundViewModes.graph },
	{ label: "Response", value: RoutePlaygroundViewModes.response },
];

export function isRoutePlaygroundViewMode(
	value: unknown,
): value is RoutePlaygroundViewMode {
	return (
		value === RoutePlaygroundViewModes.trace ||
		value === RoutePlaygroundViewModes.graph ||
		value === RoutePlaygroundViewModes.response
	);
}
