import { Stack } from "@mantine/core";
import { GraphCanvas } from "./components/GraphCanvas";
import { GraphToolbar } from "./components/GraphToolbar";
import { GraphSettingsProvider } from "./GraphSettingsContext";

export function GraphView() {
	return (
		<GraphSettingsProvider>
			<Stack gap="md">
				<GraphToolbar />
				<GraphCanvas />
			</Stack>
		</GraphSettingsProvider>
	);
}
