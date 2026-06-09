import { Badge, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { InvokeProviderResponse } from "@/api/model/index.js";
import { stringifyPretty } from "../stringifyPretty";

export function ResultPanel({
	result,
}: {
	result: InvokeProviderResponse | null;
}) {
	return (
		<Stack gap={8}>
			<Group justify="space-between">
				<Text fw={700} size="sm">
					Result
				</Text>
				{result && (
					<Badge color={result.ok ? "green" : "red"} variant="light">
						{result.ok ? "ok" : "error"}
					</Badge>
				)}
			</Group>
			<ScrollArea.Autosize mah={320} type="auto">
				<CodeHighlight
					code={
						result
							? stringifyPretty(result.ok ? result.result : result.error)
							: "No invocation yet"
					}
					language="json"
					withCopyButton={false}
				/>
			</ScrollArea.Autosize>
		</Stack>
	);
}
