import {
	Alert,
	Badge,
	Box,
	Button,
	Code,
	Group,
	Select,
	type SelectProps,
	Paper,
	ScrollArea,
	Stack,
	Tabs,
	Text,
} from "@mantine/core";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { useEffect, useMemo, useState } from "react";
import type { ModuleGraphRoute } from "@/api/model";
import { useGetDevtoolsGraphSuspense } from "@/api/graph/graph";
import { getMethodColor } from "../http-method-color";
import {
	type RequestPayload,
	createSchemaTemplate,
	parseJsonObject,
	parsePayload,
	stringifyTemplate,
} from "../json-utils";
import { useRoutePlaygroundSettings } from "../RoutePlaygroundSettingsContext";

export type RouteOccurrence = ModuleGraphRoute & {
	id: string;
	moduleId: string;
	moduleName: string;
};

export type PreparedFetchData = {
	url: string;
	method: string;
	body: string | undefined;
	headers: HeadersInit;
};

type RouteRequestPaperProps = {
	error: string | null;
	running: boolean;
	onSubmit: (data: PreparedFetchData) => void;
	onRouteChange: () => void;
};

const emptyPayload: RequestPayload = {
	params: "{}",
	query: "{}",
	headers: "{}",
	body: "{}",
};

export function RouteRequestPaper({
	error,
	running,
	onSubmit,
	onRouteChange,
}: RouteRequestPaperProps) {
	const { selectedRouteId, setSelectedRouteId } = useRoutePlaygroundSettings();
	const { data: graph } = useGetDevtoolsGraphSuspense();

	const routes = useMemo(() => {
		return graph.modules
			.flatMap((module) =>
				(module.routes ?? []).map((route) => ({
					...route,
					id: `${module.id}:${route.method}:${route.path}:${route.controller}:${route.handler}`,
					value: `${module.id}:${route.method}:${route.path}:${route.controller}:${route.handler}`,
					moduleId: module.id,
					label: route.path,
					moduleName: module.name,
				})),
			)
			.sort((a, b) => formatRouteLabel(a).localeCompare(formatRouteLabel(b)));
	}, [graph]);

	const selectedRoute =
		routes.find((route) => route.id === selectedRouteId) ?? null;

	const [payload, setPayload] = useState<RequestPayload>(() =>
		selectedRoute ? createRequestPayload(selectedRoute) : emptyPayload,
	);

	const fieldErrors = useMemo(() => {
		const errors: Partial<Record<keyof RequestPayload, boolean>> = {};
		for (const key of ["params", "query", "headers", "body"] as const) {
			const text = payload[key].trim();
			if (!text) continue;
			try {
				JSON.parse(text);
			} catch {
				errors[key] = true;
			}
		}
		return errors;
	}, [payload]);

	const hasFieldErrors = Object.keys(fieldErrors).length > 0;

	const updatePayload = (key: keyof RequestPayload, value: string) => {
		setPayload((prev) => ({ ...prev, [key]: value }));
	};

	// Clear selectedRouteId if graph loaded and route not found
	useEffect(() => {
		if (!selectedRouteId) return;
		if (routes.some((route) => route.id === selectedRouteId)) return;

		setSelectedRouteId(null);
	}, [routes, selectedRouteId, setSelectedRouteId]);

	const handleRouteChange = (routeId: string | null) => {
		setSelectedRouteId(routeId);
		onRouteChange();

		const route = routes.find((candidate) => candidate.id === routeId) ?? null;
		setPayload(createRequestPayload(route));
	};

	const requestPreview = useMemo(() => {
		if (!selectedRoute) return "Select a route";

		try {
			return `${selectedRoute.method} ${buildRequestUrl({
				path: selectedRoute.path,
				params: parseJsonObject(payload.params, "Params"),
				query: parseJsonObject(payload.query, "Query"),
			})}`;
		} catch {
			return `${selectedRoute.method} ${selectedRoute.path}`;
		}
	}, [payload.params, payload.query, selectedRoute]);

	const handleSubmit = () => {
		if (!selectedRoute || hasFieldErrors) return;

		const parsed = parsePayload(payload);
		const fetchData = prepareFetchData({
			method: selectedRoute.method,
			path: selectedRoute.path,
			...parsed,
		});
		onSubmit(fetchData);
	};

	return (
		<Paper
			withBorder
			radius="sm"
			p="md"
			style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
		>
			<ScrollArea style={{ height: "100%" }} type="auto">
				<Stack gap="md">
					<Group align="flex-end" gap="sm" wrap="nowrap">
						<Select
							clearable
							data={routes}
							label="Route"
							leftSection={
								selectedRoute && (
									<Badge
										color={getMethodColor(selectedRoute.method)}
										size="xs"
										variant="filled"
										style={{ minWidth: 50 }}
									>
										{selectedRoute.method}
									</Badge>
								)
							}
							leftSectionWidth={selectedRoute ? 62 : undefined}
							nothingFoundMessage="No routes"
							onChange={handleRouteChange}
							placeholder="Select route"
							renderOption={renderRouteOption}
							searchable
							style={{ flex: 1 }}
							value={selectedRouteId}
						/>
						<Button
							disabled={!selectedRoute || hasFieldErrors}
							loading={running}
							onClick={handleSubmit}
						>
							Send
						</Button>
					</Group>

					<Stack gap={6}>
						<Text fw={700} size="sm">
							Request
						</Text>
						<Code block>{requestPreview}</Code>
					</Stack>

					{error && (
						<Alert color="red" title="Request failed">
							{error}
						</Alert>
					)}

					<Tabs defaultValue="params" keepMounted={false}>
						<Tabs.List>
							<Tabs.Tab
								value="params"
								c={fieldErrors.params ? "red" : undefined}
							>
								Params
							</Tabs.Tab>
							<Tabs.Tab value="query" c={fieldErrors.query ? "red" : undefined}>
								Query
							</Tabs.Tab>
							<Tabs.Tab value="body" c={fieldErrors.body ? "red" : undefined}>
								Body
							</Tabs.Tab>
							<Tabs.Tab
								value="headers"
								c={fieldErrors.headers ? "red" : undefined}
							>
								Headers
							</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel pt="sm" value="params">
							<JsonEditor
								value={payload.params}
								onChange={(value) => updatePayload("params", value)}
								hasError={fieldErrors.params}
							/>
						</Tabs.Panel>
						<Tabs.Panel pt="sm" value="query">
							<JsonEditor
								value={payload.query}
								onChange={(value) => updatePayload("query", value)}
								hasError={fieldErrors.query}
							/>
						</Tabs.Panel>
						<Tabs.Panel pt="sm" value="body">
							<JsonEditor
								value={payload.body}
								onChange={(value) => updatePayload("body", value)}
								hasError={fieldErrors.body}
							/>
						</Tabs.Panel>
						<Tabs.Panel pt="sm" value="headers">
							<JsonEditor
								value={payload.headers}
								onChange={(value) => updatePayload("headers", value)}
								hasError={fieldErrors.headers}
							/>
						</Tabs.Panel>
					</Tabs>
				</Stack>
			</ScrollArea>
		</Paper>
	);
}

type JsonEditorProps = {
	value: string;
	onChange: (value: string) => void;
	hasError?: boolean;
};

function JsonEditor({ value, onChange, hasError }: JsonEditorProps) {
	return (
		<Box
			style={{
				border: hasError
					? "1px solid var(--mantine-color-red-6)"
					: "1px solid var(--mantine-color-gray-3)",
				borderRadius: "var(--mantine-radius-sm)",
				overflow: "hidden",
			}}
		>
			<CodeEditor
				value={value}
				language="json"
				data-color-mode="light"
				onChange={(e) => onChange(e.target.value)}
				padding={12}
				style={{
					fontSize: 13,
					fontFamily:
						"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
					minHeight: 180,
				}}
			/>
		</Box>
	);
}

type RouteOption = {
	value: string;
	label: string;
	method: string;
	moduleName: string;
};

const renderRouteOption: SelectProps["renderOption"] = ({ option }) => {
	const { method, moduleName } = option as RouteOption;

	return (
		<Group gap="xs" wrap="nowrap">
			<Badge
				color={getMethodColor(method)}
				size="xs"
				variant="filled"
				style={{ minWidth: 50 }}
			>
				{method}
			</Badge>
			<Text size="sm" style={{ flex: 1 }} truncate>
				{option.label}
			</Text>
			<Badge color="gray" size="xs" variant="light">
				{moduleName}
			</Badge>
		</Group>
	);
};

function formatRouteLabel(route: RouteOccurrence): string {
	return `${route.method} ${route.path} (${route.moduleName})`;
}

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);
const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

function createRequestPayload(route: ModuleGraphRoute | null): RequestPayload {
	const hasBody = route && METHODS_WITH_BODY.has(route.method);
	const headers = hasBody ? { "content-type": "application/json" } : {};

	return {
		params: stringifyTemplate(createSchemaTemplate(route?.schema?.params)),
		query: stringifyTemplate(createSchemaTemplate(route?.schema?.querystring)),
		headers: stringifyTemplate(headers),
		body: stringifyTemplate(createSchemaTemplate(route?.schema?.body)),
	};
}

export function buildRequestUrl({
	path,
	params,
	query,
}: {
	path: string;
	params: Record<string, unknown>;
	query: Record<string, unknown>;
}): string {
	const resolvedPath = path.replace(/:([A-Za-z0-9_]+)/g, (_match, key) =>
		encodeURIComponent(String(params[key] ?? "")),
	);
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(query)) {
		if (value === undefined || value === null || value === "") continue;
		if (Array.isArray(value)) {
			for (const item of value) {
				searchParams.append(key, String(item));
			}
			continue;
		}
		searchParams.set(key, String(value));
	}

	const search = searchParams.toString();

	return search ? `${resolvedPath}?${search}` : resolvedPath;
}

type RequestFormData = {
	method: string;
	path: string;
	params: Record<string, unknown>;
	query: Record<string, unknown>;
	headers: Record<string, unknown>;
	body: unknown;
};

function prepareFetchData(formData: RequestFormData): PreparedFetchData {
	const url = buildRequestUrl({
		path: formData.path,
		params: formData.params,
		query: formData.query,
	});

	const hasBody = !METHODS_WITHOUT_BODY.has(formData.method);
	const body = hasBody ? JSON.stringify(formData.body) : undefined;

	const headers: Record<string, string> = Object.fromEntries(
		Object.entries(formData.headers).map(([key, value]) => [
			key,
			String(value),
		]),
	);

	return { url, method: formData.method, body, headers };
}
