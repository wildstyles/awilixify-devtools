import { SegmentedControl, Stack, Switch, Text } from "@mantine/core";
import type { ChangeEvent } from "react";
import { useGraphSettings } from "../GraphSettingsContext";
import type { GraphViewMode } from "../types";

export function GraphSettings() {
	const {
		groupDynamicModules,
		impactOnly,
		selectedModuleAvailable,
		setGroupDynamicModules,
		setImpactOnly,
		setShowGlobalEdges,
		setShowRelatedOnly,
		setViewMode,
		showGlobalEdges,
		showRelatedOnly,
		viewMode,
	} = useGraphSettings();

	return (
		<Stack gap="xs" align="stretch">
			<Text c="dimmed" size="xs" fw={700} tt="uppercase">
				Settings
			</Text>
			<SegmentedControl
				aria-label="Graph view mode"
				data={[
					{ label: "Dependencies", value: "dependencies" },
					{ label: "Providers", value: "providers" },
				]}
				fullWidth
				size="xs"
				value={viewMode}
				onChange={(value) => setViewMode(value as GraphViewMode)}
			/>
			<Switch
				checked={showRelatedOnly}
				disabled={!selectedModuleAvailable}
				label="Related only"
				onChange={(event: ChangeEvent<HTMLInputElement>) =>
					setShowRelatedOnly(event.currentTarget.checked)
				}
			/>
			<Switch
				checked={showGlobalEdges}
				label="Global modules"
				onChange={(event: ChangeEvent<HTMLInputElement>) =>
					setShowGlobalEdges(event.currentTarget.checked)
				}
			/>
			<Switch
				checked={impactOnly}
				label="Impact only"
				onChange={(event: ChangeEvent<HTMLInputElement>) =>
					setImpactOnly(event.currentTarget.checked)
				}
			/>
			<Switch
				checked={groupDynamicModules}
				label="Group dynamic"
				onChange={(event: ChangeEvent<HTMLInputElement>) =>
					setGroupDynamicModules(event.currentTarget.checked)
				}
			/>
		</Stack>
	);
}
