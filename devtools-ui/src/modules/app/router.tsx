import {
	createHashHistory,
	createRootRoute,
	createRoute,
	createRouter,
	type RouteComponent,
} from "@tanstack/react-router";
import { AppShell } from "./AppShell";
import type { GraphViewMode } from "../graph/types";
import {
	type RoutePlaygroundViewMode,
	isRoutePlaygroundViewMode,
} from "../route-playground/types";

export type { RoutePlaygroundViewMode };

export type GraphRouteSearch = {
	groupDynamic?: boolean;
	impactOnly?: boolean;
	q?: string;
	selectedModule?: string;
	globals?: boolean;
	relatedOnly?: boolean;
	view?: GraphViewMode;
	focusProvider?: string;
	focusOccurrence?: string;
};

export type RoutePlaygroundSearch = {
	route?: string;
	trace?: string;
	view?: RoutePlaygroundViewMode;
};

export type RouterComponents = {
	GraphView: RouteComponent;
	ProviderPlaygroundView: RouteComponent;
	RoutePlaygroundView: RouteComponent;
};

export function createAppRouter(components: RouterComponents) {
	const rootRoute = createRootRoute({
		component: AppShell,
	});

	const graphRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		validateSearch: (search: Record<string, unknown>): GraphRouteSearch => ({
			groupDynamic: readBooleanSearch(search.groupDynamic),
			impactOnly: readBooleanSearch(search.impactOnly),
			q: readStringSearch(search.q),
			selectedModule: readStringSearch(search.selectedModule),
			globals: readBooleanSearch(search.globals),
			relatedOnly: readBooleanSearch(search.relatedOnly),
			view: isGraphViewMode(search.view) ? search.view : undefined,
			focusProvider: readStringSearch(search.focusProvider),
			focusOccurrence: readStringSearch(search.focusOccurrence),
		}),
		component: components.GraphView,
	});

	const playgroundRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/playground",
		component: components.ProviderPlaygroundView,
	});

	const routesRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/routes",
		validateSearch: (
			search: Record<string, unknown>,
		): RoutePlaygroundSearch => ({
			route: readStringSearch(search.route),
			trace: readStringSearch(search.trace),
			view: isRoutePlaygroundViewMode(search.view) ? search.view : undefined,
		}),
		component: components.RoutePlaygroundView,
	});

	const routeTree = rootRoute.addChildren([
		graphRoute,
		playgroundRoute,
		routesRoute,
	]);

	return createRouter({
		history: createHashHistory(),
		routeTree,
	});
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
	interface Register {
		router: AppRouter;
	}
}

function readBooleanSearch(value: unknown): boolean | undefined {
	if (typeof value === "boolean") return value;
	if (value === "1" || value === "true") return true;
	if (value === "0" || value === "false") return false;

	return undefined;
}

function readStringSearch(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value : undefined;
}

function isGraphViewMode(value: unknown): value is GraphViewMode {
	return value === "dependencies" || value === "providers";
}
