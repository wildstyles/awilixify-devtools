import {
	ActionIcon,
	Badge,
	Button,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { useState } from "react";
import type { Trace } from "@/api/model";
import { useGetDevtoolsTraces } from "@/api/traces/traces";
import { compactTrace } from "../compact-trace";
import { getMethodColor } from "../http-method-color";
import { useRoutePlaygroundSettings } from "../RoutePlaygroundSettingsContext";

export function TraceHistoryPaper() {
	const { selectedTraceId, setSelectedTraceId } = useRoutePlaygroundSettings();
	const { isLoading, data: traces = [], refetch } = useGetDevtoolsTraces();

	const selectedTrace = traces.find((trace) => trace.id === selectedTraceId);
	const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);

	const copyTrace = async (trace: Trace, event: React.MouseEvent) => {
		event.stopPropagation();
		const compact = compactTrace(trace);
		await navigator.clipboard.writeText(JSON.stringify(compact, null, 2));
		setCopiedTraceId(trace.id);
		window.setTimeout(() => setCopiedTraceId(null), 1200);
	};

	return (
		<Paper withBorder radius="sm" p="md" style={{ flex: 1, minHeight: 0 }}>
			<Stack gap="sm" style={{ height: "100%", minHeight: 0 }}>
				<Group justify="space-between">
					<Stack gap={2}>
						<Text fw={700} size="sm">
							Trace history
						</Text>
						<Text c="dimmed" size="xs">
							Last 5 HTTP calls
						</Text>
					</Stack>
					<Button
						loading={isLoading}
						onClick={() => refetch()}
						size="xs"
						variant="light"
					>
						Refresh
					</Button>
				</Group>

				<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto">
					{traces.length === 0 && (
						<Text c="dimmed" size="sm">
							No traces yet
						</Text>
					)}

					{traces.length > 0 && (
						<Stack gap={6}>
							{traces.map((trace) => {
								const selected = selectedTrace?.id === trace.id;
								const copied = copiedTraceId === trace.id;

								return (
									<Paper
										bg={selected ? "teal.0" : undefined}
										component="button"
										key={trace.id}
										onClick={() => setSelectedTraceId(trace.id)}
										p="xs"
										radius="sm"
										style={{
											border: selected
												? "1px solid var(--mantine-color-teal-4)"
												: "1px solid var(--mantine-color-gray-2)",
											cursor: "pointer",
											textAlign: "left",
										}}
									>
										<Group gap="xs" wrap="nowrap" align="flex-start">
											<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
												<Group gap="xs" wrap="nowrap">
													<Badge
														color={getMethodColor(trace.method)}
														size="sm"
													>
														{trace.method}
													</Badge>
													<Text fw={700} lineClamp={1} size="sm">
														{trace.url}
													</Text>
												</Group>
												<Group gap="xs">
													<Text c="dimmed" size="xs">
														{trace.statusCode ?? "-"}
													</Text>
													<Text c="dimmed" size="xs">
														{Math.round(trace.durationMs)} ms
													</Text>
													<Text c="dimmed" size="xs">
														{trace.spans.length} spans
													</Text>
												</Group>
											</Stack>
											<Tooltip label={copied ? "Copied!" : "Copy compact JSON"}>
												<ActionIcon
													color={copied ? "green" : "gray"}
													onClick={(e) => copyTrace(trace, e)}
													size="sm"
													variant="subtle"
												>
													<CopyIcon />
												</ActionIcon>
											</Tooltip>
										</Group>
									</Paper>
								);
							})}
						</Stack>
					)}
				</ScrollArea>
			</Stack>
		</Paper>
	);
}

function CopyIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
		</svg>
	);
}
