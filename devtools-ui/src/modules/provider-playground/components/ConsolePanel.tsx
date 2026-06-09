import { Group, ScrollArea, Stack, Text } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { InvokeProviderResponse } from "../../../api/model/index.js";
import { stringifyPretty } from "../stringifyPretty";

export function ConsolePanel({
	result,
}: {
	result: InvokeProviderResponse | null;
}) {
	const entries = result?.console ?? [];

	return (
		<Stack gap={8}>
			<Group justify="space-between">
				<Text fw={700} size="sm">
					Console
				</Text>
				<Text c="dimmed" fw={700} size="sm">
					{entries.length}
				</Text>
			</Group>
			<ScrollArea.Autosize mah={260} type="auto">
				<Stack gap={8}>
					{entries.length > 0 ? (
						entries.map((entry, index) => (
							<CodeHighlight
								key={`${entry.level}-${index}`}
								code={`${entry.level}: ${stringifyPretty(entry.args)}`}
								language="json"
								withCopyButton={false}
							/>
						))
					) : (
						<Text c="dimmed" size="sm">
							No console output
						</Text>
					)}
				</Stack>
			</ScrollArea.Autosize>
		</Stack>
	);
}
