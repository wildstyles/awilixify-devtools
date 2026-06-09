import {
	ActionIcon,
	Badge,
	Center,
	Group,
	Loader,
	Paper,
	SegmentedControl,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { Suspense } from "react";
import { useGetDevtoolsTraces } from "@/api/traces/traces";
import { getMethodColor } from "../http-method-color";
import { useRoutePlaygroundSettings } from "../RoutePlaygroundSettingsContext";
import {
	type RoutePlaygroundResponse,
	type RoutePlaygroundViewMode,
	RoutePlaygroundViewModes,
	viewModeOptions,
} from "../types";
import styles from "./TraceDetailsPaper.module.css";
import { TraceResponseTab } from "./TraceResponseTab";
import { TraceListTab } from "./trace-list/TraceListTab";
import { TraceTreeTab } from "./trace-tree/TraceTreeTab";

type TraceDetailsPaperProps = {
	response: RoutePlaygroundResponse | null;
	noTraceWarning: boolean;
};

export function TraceDetailsPaper({
	response,
	noTraceWarning,
}: TraceDetailsPaperProps) {
	const { viewMode, setViewMode, selectedTraceId } =
		useRoutePlaygroundSettings();
	const { data: traces = [] } = useGetDevtoolsTraces();

	const selectedTrace = traces.find((trace) => trace.id === selectedTraceId);

	const disabledTabs = noTraceWarning && !selectedTrace;
	const segmentedControlData = viewModeOptions.map((option) => ({
		...option,
		disabled:
			disabledTabs && option.value !== RoutePlaygroundViewModes.response,
	}));

	return (
		<Paper withBorder radius="sm" p="md" className={styles.panel}>
			<Stack gap="md" className={styles.content}>
				{(selectedTrace || noTraceWarning) && (
					<Group gap={4}>
						<SegmentedControl
							data={segmentedControlData}
							onChange={(value) =>
								setViewMode(value as RoutePlaygroundViewMode)
							}
							size="xs"
							value={viewMode}
						/>
					</Group>
				)}

				{selectedTrace && (
					<Stack gap="sm" className={styles.traceContent}>
						<Group justify="space-between">
							<Group gap="xs">
								<Badge color={getMethodColor(selectedTrace.method)}>
									{selectedTrace.method}
								</Badge>
								<Text fw={700} size="sm">
									{selectedTrace.url}
								</Text>
							</Group>
							<Group gap="xs">
								<Badge color={selectedTrace.status === "ok" ? "green" : "red"}>
									{selectedTrace.statusCode ?? "-"} {selectedTrace.status}
								</Badge>
								<Badge color="gray" variant="light">
									{Math.round(selectedTrace.durationMs)} ms
								</Badge>
								<Tooltip
									label="Status is the HTTP/result status. Duration is elapsed wall-clock time for the trace; nested span durations are inclusive and should not be summed directly."
									multiline
									w={300}
									withArrow
								>
									<ActionIcon
										aria-label="Trace status and duration help"
										color="gray"
										size="sm"
										variant="subtle"
									>
										<InfoIcon />
									</ActionIcon>
								</Tooltip>
							</Group>
						</Group>

						{viewMode === "response" && (
							<TraceResponseTab
								response={response}
								trace={selectedTrace}
								noTraceWarning={false}
							/>
						)}

						{viewMode === "trace" && <TraceListTab trace={selectedTrace} />}

						{viewMode === "graph" && (
							<Suspense fallback={<Loader size="sm" />}>
								<TraceTreeTab trace={selectedTrace} />
							</Suspense>
						)}
					</Stack>
				)}

				{!selectedTrace && noTraceWarning && response && (
					<Stack gap="sm" className={styles.traceContent}>
						<TraceResponseTab response={response} trace={null} noTraceWarning />
					</Stack>
				)}

				{!selectedTrace && !noTraceWarning && <EmptyState />}
			</Stack>
		</Paper>
	);
}

function InfoIcon() {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height="14"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			width="14"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		</svg>
	);
}

function EmptyState() {
	return (
		<Center className={styles.traceContent}>
			<Stack align="center" gap="xs">
				<Text c="dimmed" size="lg">
					No trace selected
				</Text>
				<Text c="dimmed" size="sm">
					Run a route or select a trace from history
				</Text>
			</Stack>
		</Center>
	);
}
