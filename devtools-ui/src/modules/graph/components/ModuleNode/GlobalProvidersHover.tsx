import { Badge, Group, HoverCard, Stack, Text } from "@mantine/core";
import type { ModuleFlowNode } from "../../types";
import styles from "./ModuleNode.module.css";

export function GlobalProvidersHover({
	data,
}: {
	data: ModuleFlowNode["data"];
}) {
	if (
		data.kind === "global" ||
		!data.isSelectedModule ||
		data.globalProviderGroups.length === 0
	) {
		return null;
	}

	return (
		<HoverCard openDelay={150} position="bottom-end" shadow="md" withArrow>
			<HoverCard.Target>
				<button
					aria-label="Show exported global providers"
					className={styles.globalProvidersTrigger}
					onClick={(event) => event.stopPropagation()}
					onPointerDown={(event) => event.stopPropagation()}
					type="button"
				>
					G
				</button>
			</HoverCard.Target>
			<HoverCard.Dropdown
				className={styles.globalProvidersPopover}
				onClick={(event) => event.stopPropagation()}
				onPointerDown={(event) => event.stopPropagation()}
			>
				<Stack gap={8}>
					<Text c="dimmed" fw={700} size="xs">
						Exported global providers
					</Text>
					{data.globalProviderGroups.map((group) => (
						<Stack gap={4} key={group.moduleId}>
							<Text fw={700} size="xs">
								{group.moduleName}
							</Text>
							<Group gap={4}>
								{group.providers.map((provider) => (
									<Badge
										className={styles.globalProviderBadge}
										key={provider}
										radius="sm"
										variant="light"
									>
										{provider}
									</Badge>
								))}
							</Group>
						</Stack>
					))}
				</Stack>
			</HoverCard.Dropdown>
		</HoverCard>
	);
}
