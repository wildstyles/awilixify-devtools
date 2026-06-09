import { Alert, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { Trace } from "@/api/model";
import { stringifyPretty } from "../../provider-playground/stringifyPretty";
import type { RoutePlaygroundResponse } from "../types";

type TraceResponseTabProps = {
	response: RoutePlaygroundResponse | null;
	trace: Trace | null;
	noTraceWarning: boolean;
};

export function TraceResponseTab({
	response,
	trace,
	noTraceWarning,
}: TraceResponseTabProps) {
	const displayBody = trace?.response ?? response?.body;

	return (
		<Stack gap="md">
			{noTraceWarning && (
				<Alert color="yellow" title="No trace captured">
					Request completed but no trace was created. This can happen when fails
					happens before framework tracing monitoring start. In some HTTP native
					middlewares like schema validation.
				</Alert>
			)}

			<Group justify="space-between">
				<Text fw={700} size="sm">
					Response
				</Text>
			</Group>

			<Stack gap={6}>
				<Text c="dimmed" fw={700} size="xs">
					Body
				</Text>
				<ScrollArea.Autosize mah={720} type="auto">
					<CodeHighlight
						withLineNumbers
						code={
							displayBody !== undefined
								? stringifyPretty(displayBody)
								: "No response yet"
						}
						language="json"
						withCopyButton={false}
					/>
				</ScrollArea.Autosize>
			</Stack>
		</Stack>
	);
}
