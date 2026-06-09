import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { RoutePlaygroundSearch } from "../app/router";
import { type RoutePlaygroundViewMode, RoutePlaygroundViewModes } from "./types";

type RoutePlaygroundSettings = {
	selectedRouteId: string | null;
	selectedTraceId: string | null;
	viewMode: RoutePlaygroundViewMode;
	setSelectedRouteId: (routeId: string | null) => void;
	setSelectedTraceId: (traceId: string | null) => void;
	setViewMode: (viewMode: RoutePlaygroundViewMode) => void;
};

const defaultViewMode = RoutePlaygroundViewModes.trace;

const RoutePlaygroundSettingsContext = createContext<RoutePlaygroundSettings | null>(null);

export function RoutePlaygroundSettingsProvider({ children }: { children: ReactNode }) {
	const routeSearch = useSearch({ from: "/routes" });
	const navigate = useNavigate({ from: "/routes" });

	const [selectedRouteId, setSelectedRouteIdState] = useState<string | null>(
		routeSearch.route ?? null,
	);
	const [selectedTraceId, setSelectedTraceIdState] = useState<string | null>(
		routeSearch.trace ?? null,
	);
	const [viewMode, setViewModeState] = useState<RoutePlaygroundViewMode>(
		routeSearch.view ?? defaultViewMode,
	);

	const setSelectedRouteId = useCallback((routeId: string | null) => {
		setSelectedRouteIdState(routeId);
	}, []);

	const setSelectedTraceId = useCallback((traceId: string | null) => {
		setSelectedTraceIdState(traceId);
	}, []);

	const setViewMode = useCallback((mode: RoutePlaygroundViewMode) => {
		setViewModeState(mode);
	}, []);

	useEffect(() => {
		navigate({
			replace: true,
			search: {
				route: selectedRouteId ?? undefined,
				trace: selectedTraceId ?? undefined,
				view: viewMode === defaultViewMode ? undefined : viewMode,
			} satisfies RoutePlaygroundSearch,
		});
	}, [navigate, selectedRouteId, selectedTraceId, viewMode]);

	const value = useMemo<RoutePlaygroundSettings>(
		() => ({
			selectedRouteId,
			selectedTraceId,
			viewMode,
			setSelectedRouteId,
			setSelectedTraceId,
			setViewMode,
		}),
		[
			selectedRouteId,
			selectedTraceId,
			viewMode,
			setSelectedRouteId,
			setSelectedTraceId,
			setViewMode,
		],
	);

	return (
		<RoutePlaygroundSettingsContext.Provider value={value}>
			{children}
		</RoutePlaygroundSettingsContext.Provider>
	);
}

export function useRoutePlaygroundSettings() {
	const context = useContext(RoutePlaygroundSettingsContext);
	if (!context) {
		throw new Error(
			"useRoutePlaygroundSettings must be used within RoutePlaygroundSettingsProvider",
		);
	}

	return context;
}
