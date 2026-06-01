import { Divider, Group, Stack, Text } from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";

export function GraphLegend() {
  return (
    <Stack gap={8}>
      <Text c="dimmed" size="xs" fw={700} tt="uppercase">
        Legend
      </Text>

      <LegendSection title="Modules">
        <LegendItem color="var(--graph-color-selected)" label="Selected" />
        <LegendItem color="var(--graph-color-dependency)" label="Dependency" />
        <LegendItem color="var(--graph-color-dependent)" label="Dependent" />
        <LegendItem color="var(--graph-color-global)" label="Global" />
        <LegendItem color="var(--graph-color-dynamic)" label="Dynamic group" />
      </LegendSection>

      <Divider />

      <LegendSection title="Provider focus">
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
      </LegendSection>

      <Divider />

      <LegendSection title="Provider status">
        <LegendItem color="var(--graph-color-new-provider)" dot label="New" />
        <LegendItem
          color="var(--graph-color-deleted-provider)"
          dot
          label="Deleted"
        />
        <LegendItem
          color="var(--graph-color-changed-provider)"
          dot
          label="Changed"
        />
        <LegendItem
          color="var(--graph-color-affected-provider)"
          dot
          dotVariant="outline"
          label="Affected"
        />
      </LegendSection>

      <Divider />

      <LegendSection title="Provider metadata">
        <LegendItem
          background="var(--mantine-color-gray-0)"
          borderStyle="dashed"
          color="var(--mantine-color-gray-5)"
          label="Exported"
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
      </LegendSection>
    </Stack>
  );
}

function LegendSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Stack gap={4}>
      <Text c="dimmed" fw={700} size="xs">
        {title}
      </Text>
      {children}
    </Stack>
  );
}

function LegendItem({
  background,
  borderStyle = "solid",
  borderWidth = 2,
  color,
  dot = false,
  dotVariant = "filled",
  iconLabel,
  label,
}: {
  background?: string;
  borderStyle?: "dashed" | "solid";
  borderWidth?: number;
  color: string;
  dot?: boolean;
  dotVariant?: "filled" | "outline";
  iconLabel?: string;
  label: string;
}) {
  return (
    <Group gap={8} wrap="nowrap">
      <span
        className={[
          "graph-legend-swatch",
          dot ? "dot" : "",
          iconLabel ? "icon" : "",
          dotVariant === "outline" ? "outline" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          {
            "--legend-background": background,
            "--legend-border-style": borderStyle,
            "--legend-border-width": `${borderWidth}px`,
            "--legend-color": color,
          } as CSSProperties
        }
      >
        {iconLabel}
      </span>
      <Text size="xs">{label}</Text>
    </Group>
  );
}
