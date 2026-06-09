import clsx from "clsx";
import { Divider, Group, Stack, Text } from "@mantine/core";
import styles from "./GraphLegend.module.css";

const compactGap = "calc(var(--mantine-spacing-xs) / 2)";

export function GraphLegend() {
	return (
		<Stack gap="xs">
			<Text c="dimmed" size="xs" fw={700} tt="uppercase">
				Legend
			</Text>

			<Stack gap={compactGap}>
				<Text c="dimmed" fw={700} size="xs">
					Modules
				</Text>
				<LegendItem color="var(--graph-color-selected)" label="Selected" />
				<LegendItem color="var(--graph-color-dependency)" label="Dependency" />
				<LegendItem color="var(--graph-color-dependent)" label="Dependent" />
				<LegendItem color="var(--graph-color-global)" label="Global" />
				<LegendItem color="var(--graph-color-dynamic)" label="Dynamic group" />
			</Stack>

			<Divider />

			<Stack gap={compactGap}>
				<Text c="dimmed" fw={700} size="xs">
					Provider focus
				</Text>

				<LegendItem
					background="var(--graph-color-provider-focus-selected)"
					color="var(--mantine-color-orange-4)"
					label="Selected"
				/>
				<LegendItem
					background="var(--graph-color-provider-focus-same)"
					color="var(--mantine-color-orange-3)"
					label="Same provider"
				/>
				<LegendItem
					background="var(--graph-color-provider-focus-dependant)"
					color="var(--mantine-color-yellow-5)"
					label="Depends on selected"
				/>
			</Stack>

			<Divider />

			<Stack gap={compactGap}>
				<Text c="dimmed" fw={700} size="xs">
					Provider status
				</Text>

				<LegendItem
					color="var(--graph-color-new-provider)"
					label="New"
					size="small"
				/>
				<LegendItem
					color="var(--graph-color-deleted-provider)"
					label="Deleted"
					size="small"
				/>
				<LegendItem
					color="var(--graph-color-changed-provider)"
					label="Changed"
					size="small"
				/>
				<LegendItem
					color="var(--graph-color-affected-provider)"
					label="Affected"
					size="small"
					variant="outline"
				/>
			</Stack>

			<Divider />

			<Stack gap={compactGap}>
				<Text c="dimmed" fw={700} size="xs">
					Provider metadata
				</Text>

				<LegendItem
					background="var(--mantine-color-gray-0)"
					color="var(--mantine-color-gray-5)"
					label="Exported"
					variant="dashed"
				/>
				<LegendItem
					color="var(--graph-color-scoped-provider)"
					iconLabel="S"
					label="Scoped"
				/>
				<LegendItem
					color="var(--graph-color-transient-provider)"
					iconLabel="T"
					label="Transient"
				/>
				<LegendItem
					color="var(--graph-color-eager-provider)"
					iconLabel="E"
					label="Eager"
				/>
			</Stack>
		</Stack>
	);
}

function LegendItem({
	background,
	color,
	iconLabel,
	label,
	size = "medium",
	variant = "filled",
}: {
	background?: string;
	color: string;
	iconLabel?: string;
	label: string;
	size?: "medium" | "small";
	variant?: "dashed" | "filled" | "outline";
}) {
	return (
		<Group gap={compactGap} wrap="nowrap">
			<span
				aria-hidden="true"
				className={clsx(styles.swatch, styles[size], styles[variant])}
				style={{
					background:
						variant === "outline" ? "transparent" : (background ?? color),
					borderColor: color,
					borderStyle: variant === "dashed" ? "dashed" : "solid",
				}}
			>
				{iconLabel}
			</span>

			<Text size="xs">{label}</Text>
		</Group>
	);
}
