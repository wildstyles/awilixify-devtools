import { Paper, Stack, Text } from "@mantine/core";
import { Handle, Position } from "@xyflow/react";
import type { ModuleProviderImpact } from "@/api/model/index";
import { useGraphSettings } from "../../GraphSettingsContext";
import type { ModuleFlowNode, ProviderImpactStatusByName } from "../../types";
import { HighlightedText } from "./HighlightedText";
import styles from "./ModuleNode.module.css";
import { ProviderBadge } from "./ProviderBadge";

export function ProviderGroup({
	data,
	group,
	groupKey,
	showHandles = true,
}: {
	data: ModuleFlowNode["data"];
	group?: ModuleFlowNode["data"]["importedProviderGroups"][number];
	groupKey: string;
	showHandles?: boolean;
}) {
	const { searchQuery } = useGraphSettings();
	const isOwnGroup = group === undefined;
	const color = group?.color ?? data.providerRelationColor;
	const exportedProviders = group?.color ? group.providers : data.exports;
	const handleId = group ? `provider-group:${group.moduleId}` : undefined;
	const impact = group?.impact ?? data.impact;
	const source = group ?? data;
	const providers =
		group?.providers ?? withDeletedProviders(data.providers, impact.deleted);
	const title = group?.moduleName ?? "Own providers";
	const exportedProviderNames = new Set(exportedProviders);

	return (
		<Paper
			component="section"
			p={8}
			radius="sm"
			style={{
				background: "rgb(255 255 255 / 70%)",
				borderLeft: color ? `4px solid ${color}` : undefined,
				display: "grid",
				gap: 6,
				position: "relative",
			}}
			withBorder
		>
			{showHandles && isOwnGroup && (
				<Handle
					id="provider-group:own"
					type="target"
					position={Position.Left}
				/>
			)}
			{showHandles && handleId && (
				<Handle
					id={handleId}
					type="source"
					position={Position.Right}
					style={
						color
							? {
									background: color,
									borderColor: color,
								}
							: undefined
					}
				/>
			)}
			<Text c={isOwnGroup ? "dimmed" : (color ?? "dimmed")} fw={700} size="xs">
				<HighlightedText query={searchQuery} text={title} />
			</Text>
			{providers.length > 0 ? (
				<Stack className={styles.providerDepsList} gap={6}>
					{providers.map((provider) => (
						<ProviderBadge
							data={data}
							color={color}
							exported={exportedProviderNames.has(provider)}
							groupKey={groupKey}
							impact={impact}
							key={provider}
							provider={provider}
							source={source}
						/>
					))}
				</Stack>
			) : (
				<Text c="dimmed" size="xs">
					No providers
				</Text>
			)}
		</Paper>
	);
}

function withDeletedProviders(
	providers: string[],
	deletedProviders: string[],
): string[] {
	return [...new Set([...providers, ...deletedProviders])];
}

export function getDependencyProviderColorByName(
	groups: ModuleFlowNode["data"]["importedProviderGroups"],
): Record<string, string> {
	const colorByName: Record<string, string> = {};

	for (const group of groups) {
		if (!group.color) continue;

		for (const provider of group.providers) {
			colorByName[provider] = group.color;
		}
	}

	return colorByName;
}
