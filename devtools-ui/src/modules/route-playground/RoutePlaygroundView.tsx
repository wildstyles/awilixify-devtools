import { Grid, Group, Stack, Text, Title } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useGetDevtoolsTraces } from "@/api/traces/traces";
import {
	type PreparedFetchData,
	RouteRequestPaper,
} from "./components/RouteRequestPaper";
import { TraceDetailsPaper } from "./components/TraceDetailsPaper";
import { TraceHistoryPaper } from "./components/TraceHistoryPaper";
import {
	RoutePlaygroundSettingsProvider,
	useRoutePlaygroundSettings,
} from "./RoutePlaygroundSettingsContext";
import {
	type RoutePlaygroundResponse,
	RoutePlaygroundViewModes,
} from "./types";

export function RoutePlaygroundView() {
	return (
		<RoutePlaygroundSettingsProvider>
			<RoutePlaygroundViewContent />
		</RoutePlaygroundSettingsProvider>
	);
}

function RoutePlaygroundViewContent() {
	const { setSelectedTraceId, setViewMode } = useRoutePlaygroundSettings();
	const { data: traces = [], refetch } = useGetDevtoolsTraces();
	const [noTraceWarning, setNoTraceWarning] = useState(false);

	const previousFirstTraceIdRef = useRef<string | undefined>(undefined);

	const mutation = useMutation<
		RoutePlaygroundResponse,
		Error,
		PreparedFetchData
	>({
		mutationFn: async (fetchData: PreparedFetchData) => {
			const response = await fetch(fetchData.url, {
				body: fetchData.body,
				headers: fetchData.headers,
				method: fetchData.method,
			});

			const text = await response.text();
			const isJson = response.headers
				.get("content-type")
				?.includes("application/json");

			return {
				body: isJson && text ? JSON.parse(text) : text,
				headers: Object.fromEntries(response.headers.entries()),
				ok: response.ok,
				status: response.status,
				statusText: response.statusText,
			};
		},
		onMutate: () => {
			previousFirstTraceIdRef.current = traces[0]?.id;
			setNoTraceWarning(false);
		},
		onSettled: async () => {
			const result = await refetch();
			const newFirstTraceId = result.data?.[0]?.id;

			if (
				newFirstTraceId &&
				newFirstTraceId !== previousFirstTraceIdRef.current
			) {
				setSelectedTraceId(newFirstTraceId);
			} else {
				setSelectedTraceId(null);
				setNoTraceWarning(true);
				setViewMode(RoutePlaygroundViewModes.response);
			}
		},
	});

	const handleRouteChange = () => {
		mutation.reset();
		setNoTraceWarning(false);
	};

	const error = mutation.error
		? mutation.error instanceof Error
			? mutation.error.message
			: String(mutation.error)
		: null;

	return (
		<Stack gap="md">
			<Group align="flex-start" justify="space-between">
				<Stack gap={2}>
					<Title order={2}>Route playground</Title>
					<Text c="dimmed" size="sm">
						Send requests to live routes collected from controller decorators.
					</Text>
				</Stack>
			</Group>

			<Grid gutter="md" align="stretch">
				<Grid.Col span={{ base: 12, lg: 4 }}>
					<Stack
						gap="md"
						style={{
							height: "88vh",
						}}
					>
						<RouteRequestPaper
							error={error}
							running={mutation.isPending}
							onSubmit={mutation.mutate}
							onRouteChange={handleRouteChange}
						/>

						<TraceHistoryPaper />
					</Stack>
				</Grid.Col>

				<Grid.Col span={{ base: 12, lg: 8 }}>
					<TraceDetailsPaper
						response={mutation.data ?? null}
						noTraceWarning={noTraceWarning}
					/>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
