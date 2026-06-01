import { Badge, Group, HoverCard, Paper, Stack, Text } from "@mantine/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  getOwnProviderGroupHandleId,
  getProviderGroupHandleId,
  type ModuleFlowNode,
  type ProviderImpactStatus,
  type ProviderImpactStatusByName,
  type ProviderLifetime,
} from "../../../graph/toFlowGraph";

export function ModuleNode({ data, selected }: NodeProps<ModuleFlowNode>) {
  const isProviderMode = data.viewMode === "providers";

  return (
    <Paper
      component="article"
      data-module-node
      data-selected={selected ? "true" : undefined}
      p="md"
      radius="sm"
      shadow="md"
      style={{
        alignContent: isProviderMode ? "start" : undefined,
        borderColor: data.providerRelationColor,
        borderWidth: data.providerRelationColor ? 2 : undefined,
        color: "#202124",
        display: "grid",
        gap: 8,
        minHeight: 150,
        position: "relative",
        width: isProviderMode ? 380 : 260,
        zIndex: 2,
      }}
      withBorder
    >
      {!isProviderMode ? (
        <Handle type="target" position={Position.Left} />
      ) : null}

      <Group gap={6} justify="space-between" wrap="nowrap">
        <Text component="strong" fw={700} truncate>
          <HighlightedText
            query={data.searchQuery}
            text={getModuleTitle(data)}
          />
        </Text>
        <GlobalProvidersHover data={data} />
      </Group>

      {isProviderMode ? (
        <ProviderBlocks data={data} />
      ) : (
        <Group gap={8}>
          <Badge
            className="module-relation-badge dependency"
            radius="sm"
            variant="light"
          >
            {data.dependencyCount} deps
          </Badge>
          <Badge
            className="module-relation-badge dependent"
            radius="sm"
            variant="light"
          >
            {data.dependentCount} dependents
          </Badge>
        </Group>
      )}

      {!isProviderMode ? (
        <Handle type="source" position={Position.Right} />
      ) : null}
    </Paper>
  );
}

function getModuleTitle(data: ModuleFlowNode["data"]): string {
  return data.grouped ? `${data.name} (${data.instanceCount})` : data.name;
}

function GlobalProvidersHover({ data }: { data: ModuleFlowNode["data"] }) {
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
          className="global-providers-trigger"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          G
        </button>
      </HoverCard.Target>
      <HoverCard.Dropdown
        className="global-providers-popover"
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
                    className="global-provider-badge"
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

function ProviderBlocks({ data }: { data: ModuleFlowNode["data"] }) {
  const dependencyProviderColorByName = getDependencyProviderColorByName(
    data.importedProviderGroups,
  );

  return (
    <Stack gap={10}>
      <ProviderGroup
        color={data.providerRelationColor}
        dependencyProviderColorByName={dependencyProviderColorByName}
        exportedProviders={data.exports}
        groupKey="own"
        impact={data.providerImpact}
        hostModuleId={data.id}
        moduleId={data.id}
        providerAllowCircular={data.providerAllowCircular ?? {}}
        providerDependencies={data.providerDependencies ?? {}}
        providerEager={data.providerEager ?? {}}
        providerImpactStatusByName={data.providerImpactStatusByName}
        providerInitAfter={data.providerInitAfter ?? {}}
        providerLifetimeByName={data.providerLifetimeByName}
        providerLifetimes={data.providerLifetimes ?? {}}
        providerFocus={data.providerFocus}
        onProviderFocusChange={data.onProviderFocusChange}
        searchQuery={data.searchQuery}
        title="Own providers"
        providers={data.providers}
      />
      {data.importedProviderGroups.map((group) => (
        <ProviderGroup
          exportedProviders={group.color ? group.providers : []}
          color={group.color}
          dependencyProviderColorByName={dependencyProviderColorByName}
          groupKey={group.moduleId}
          handleId={getProviderGroupHandleId(group.moduleId)}
          impact={group.impact}
          hostModuleId={data.id}
          key={group.moduleId}
          moduleId={group.moduleId}
          providerAllowCircular={group.providerAllowCircular}
          providerDependencies={group.providerDependencies}
          providerEager={group.providerEager}
          providerImpactStatusByName={group.providerImpactStatusByName}
          providerInitAfter={group.providerInitAfter}
          providerLifetimeByName={group.providerLifetimeByName}
          providerLifetimes={group.providerLifetimes}
          providerFocus={data.providerFocus}
          onProviderFocusChange={data.onProviderFocusChange}
          searchQuery={data.searchQuery}
          title={group.moduleName}
          providers={group.providers}
        />
      ))}
    </Stack>
  );
}

function getDependencyProviderColorByName(
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

function ProviderGroup({
  color,
  dependencyProviderColorByName,
  exportedProviders,
  groupKey,
  handleId,
  hostModuleId,
  impact,
  moduleId,
  providerAllowCircular,
  providerDependencies,
  providerEager,
  providerImpactStatusByName,
  providerInitAfter,
  providerLifetimeByName,
  providerLifetimes,
  providerFocus,
  onProviderFocusChange,
  providers,
  searchQuery,
  title,
}: {
  color?: string;
  dependencyProviderColorByName: Record<string, string>;
  exportedProviders: string[];
  groupKey: string;
  handleId?: string;
  hostModuleId: string;
  impact: ModuleFlowNode["data"]["providerImpact"];
  moduleId: string;
  providerAllowCircular: Record<string, boolean>;
  providerDependencies: Record<string, string[]>;
  providerEager: Record<string, boolean>;
  providerImpactStatusByName: ProviderImpactStatusByName;
  providerInitAfter: Record<string, string[]>;
  providerLifetimeByName: Record<string, ProviderLifetime>;
  providerLifetimes: Record<string, ProviderLifetime>;
  providerFocus: ModuleFlowNode["data"]["providerFocus"];
  onProviderFocusChange: ModuleFlowNode["data"]["onProviderFocusChange"];
  providers: string[];
  searchQuery: string;
  title: string;
}) {
  const exportedProviderNames = new Set(exportedProviders);
  const affectedProviderNames = new Set(impact.affected);
  const addedProviderNames = new Set(impact.added);
  const changedProviderNames = new Set(impact.changed);
  const deletedProviderNames = new Set(impact.deleted);

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
      {title === "Own providers" ? (
        <Handle
          id={getOwnProviderGroupHandleId()}
          type="target"
          position={Position.Left}
        />
      ) : null}
      {handleId ? (
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
      ) : null}
      <Text
        c={title === "Own providers" ? "dimmed" : (color ?? "dimmed")}
        fw={700}
        size="xs"
      >
        <HighlightedText query={searchQuery} text={title} />
      </Text>
      {providers.length > 0 ? (
        <Stack className="provider-deps-list" gap={6}>
          {providers.map((provider) => {
            const occurrenceId = getProviderOccurrenceId(
              hostModuleId,
              groupKey,
              provider,
            );
            const focusClass = getProviderFocusClass(
              provider,
              occurrenceId,
              providerFocus,
            );

            return (
              <HoverCard
                key={provider}
                openDelay={150}
                position="right-start"
                shadow="md"
                withArrow
                withinPortal
              >
                <HoverCard.Target>
                  <Badge
                    className={["provider-deps-trigger", focusClass]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleProviderFocus(
                        provider,
                        occurrenceId,
                        providerFocus,
                        onProviderFocusChange,
                      );
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    radius="sm"
                    styles={{
                      label: {
                        textTransform: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                      root: getProviderChipStyles(
                        exportedProviderNames.has(provider),
                        color,
                        focusClass,
                      ),
                    }}
                    variant="light"
                  >
                    <ProviderStatusDot
                      added={addedProviderNames.has(provider)}
                      affected={affectedProviderNames.has(provider)}
                      changed={changedProviderNames.has(provider)}
                      deleted={deletedProviderNames.has(provider)}
                    />
                    <HighlightedText query={searchQuery} text={provider} />
                    {providerAllowCircular[provider] ? (
                      <AllowCircularIcon />
                    ) : null}
                    {providerEager[provider] ? <EagerProviderIcon /> : null}
                    <ProviderLifetimeIcon
                      lifetime={providerLifetimes[provider]}
                    />
                  </Badge>
                </HoverCard.Target>
                <HoverCard.Dropdown
                  className="provider-deps-popover"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <ProviderDependencyList
                    dependencyProviderColorByName={
                      dependencyProviderColorByName
                    }
                    dependencies={providerDependencies[provider] ?? []}
                    initAfter={providerInitAfter[provider] ?? []}
                    providerImpactStatusByName={providerImpactStatusByName}
                    providerLifetimes={providerLifetimeByName}
                    searchQuery={searchQuery}
                  />
                </HoverCard.Dropdown>
              </HoverCard>
            );
          })}
        </Stack>
      ) : (
        <Text c="dimmed" size="xs">
          No providers
        </Text>
      )}
    </Paper>
  );
}

function AllowCircularIcon() {
  return (
    <span
      aria-label="Allows circular dependency"
      className="provider-allow-circular-icon"
      title="Allows circular dependency"
    />
  );
}

function getProviderFocusClass(
  provider: string,
  occurrenceId: string,
  providerFocus: ModuleFlowNode["data"]["providerFocus"],
) {
  if (!providerFocus) return "";

  if (provider === providerFocus.provider) {
    return occurrenceId === providerFocus.occurrenceId
      ? "provider-focus-selected"
      : "provider-focus-same";
  }
  if (providerFocus.dependants.includes(provider)) {
    return "provider-focus-dependant";
  }

  return "provider-focus-dimmed";
}

function toggleProviderFocus(
  provider: string,
  occurrenceId: string,
  providerFocus: ModuleFlowNode["data"]["providerFocus"],
  onProviderFocusChange: ModuleFlowNode["data"]["onProviderFocusChange"],
) {
  onProviderFocusChange?.(
    providerFocus?.provider === provider &&
      providerFocus.occurrenceId === occurrenceId
      ? null
      : { occurrenceId, provider },
  );
}

function getProviderOccurrenceId(
  hostModuleId: string,
  groupKey: string,
  provider: string,
) {
  return `${hostModuleId}:${groupKey}:${provider}`;
}

function EagerProviderIcon() {
  return (
    <span
      aria-label="Eager provider"
      className="provider-eager-icon"
      title="Eager provider"
    >
      E
    </span>
  );
}

function ProviderLifetimeIcon({ lifetime }: { lifetime?: ProviderLifetime }) {
  if (lifetime !== "SCOPED" && lifetime !== "TRANSIENT") return null;

  return (
    <span
      aria-label={`${lifetime.toLowerCase()} provider`}
      className={[
        "provider-lifetime-icon",
        lifetime === "SCOPED" ? "scoped" : "transient",
      ].join(" ")}
      title={`${lifetime.toLowerCase()} provider`}
    >
      {lifetime === "SCOPED" ? "S" : "T"}
    </span>
  );
}

function ProviderDependencyList({
  dependencyProviderColorByName,
  dependencies,
  initAfter,
  providerImpactStatusByName,
  providerLifetimes,
  searchQuery,
}: {
  dependencyProviderColorByName: Record<string, string>;
  dependencies: string[];
  initAfter: string[];
  providerImpactStatusByName: ProviderImpactStatusByName;
  providerLifetimes: Record<string, ProviderLifetime>;
  searchQuery: string;
}) {
  if (dependencies.length === 0 && initAfter.length === 0) {
    return <ProviderDependencyPopoverHeader empty />;
  }

  return (
    <Stack gap={6}>
      <ProviderDependencyPopoverHeader />
      <ProviderTokenList
        dependencyProviderColorByName={dependencyProviderColorByName}
        providerImpactStatusByName={providerImpactStatusByName}
        providerLifetimes={providerLifetimes}
        providers={dependencies}
        searchQuery={searchQuery}
      />
      {initAfter.length > 0 ? (
        <Stack gap={4}>
          <Text c="dimmed" fw={700} size="xs">
            Init after
          </Text>
          <ProviderTokenList
            dependencyProviderColorByName={dependencyProviderColorByName}
            providerImpactStatusByName={providerImpactStatusByName}
            providerLifetimes={providerLifetimes}
            providers={initAfter}
            searchQuery={searchQuery}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}

function ProviderTokenList({
  dependencyProviderColorByName,
  providerImpactStatusByName,
  providerLifetimes,
  providers,
  searchQuery,
}: {
  dependencyProviderColorByName: Record<string, string>;
  providerImpactStatusByName: ProviderImpactStatusByName;
  providerLifetimes: Record<string, ProviderLifetime>;
  providers: string[];
  searchQuery: string;
}) {
  if (providers.length === 0) {
    return (
      <Text c="dimmed" size="xs">
        None
      </Text>
    );
  }

  return (
    <Stack gap={4}>
      {providers.map((provider) => (
        <Badge
          key={provider}
          className="provider-dependency-badge"
          radius="sm"
          styles={{
            label: {
              textTransform: "none",
            },
            root: getProviderDependencyBadgeStyles(
              dependencyProviderColorByName[provider],
            ),
          }}
          variant="light"
        >
          <ProviderStatusDot status={providerImpactStatusByName[provider]} />
          <HighlightedText query={searchQuery} text={provider} />
          <ProviderLifetimeIcon lifetime={providerLifetimes[provider]} />
        </Badge>
      ))}
    </Stack>
  );
}

function ProviderDependencyPopoverHeader({ empty }: { empty?: boolean }) {
  return (
    <Stack gap={4}>
      <Text c="dimmed" fw={700} size="xs">
        Constructor dependencies
      </Text>
      {empty ? (
        <Text c="dimmed" size="xs">
          No constructor dependencies
        </Text>
      ) : null}
    </Stack>
  );
}

function HighlightedText({ query, text }: { query: string; text: string }) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return text;

  const parts = splitByQuery(text, normalizedQuery);

  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            className="graph-search-highlight"
            key={`${part.text}-${index}`}
          >
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

function splitByQuery(
  text: string,
  query: string,
): Array<{
  match: boolean;
  text: string;
}> {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: Array<{ match: boolean; text: string }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, cursor);

    if (matchIndex === -1) {
      parts.push({ match: false, text: text.slice(cursor) });
      break;
    }

    if (matchIndex > cursor) {
      parts.push({ match: false, text: text.slice(cursor, matchIndex) });
    }

    parts.push({
      match: true,
      text: text.slice(matchIndex, matchIndex + query.length),
    });
    cursor = matchIndex + query.length;
  }

  return parts;
}

function ProviderStatusDot({
  added,
  affected,
  changed,
  deleted,
  status,
}: {
  added?: boolean;
  affected?: boolean;
  changed?: boolean;
  deleted?: boolean;
  status?: ProviderImpactStatus;
}) {
  if (status) {
    return <span className={["provider-status-dot", status].join(" ")} />;
  }

  if (!deleted && !added && !changed && !affected) return null;
  const resolvedStatus = deleted
    ? "deleted"
    : added
      ? "new"
      : changed
        ? "changed"
        : "affected";

  return <span className={["provider-status-dot", resolvedStatus].join(" ")} />;
}

function getProviderChipStyles(
  exported: boolean,
  groupColor: string | undefined,
  focusClass: string,
) {
  const baseStyles = {
    color: "var(--mantine-color-gray-8)",
    fontWeight: 500,
    justifyContent: "flex-start",
    maxWidth: "100%",
    width: "100%",
  };
  const focusStyles = getProviderFocusStyles(focusClass);

  if (groupColor && exported) {
    return {
      ...baseStyles,
      background: "var(--mantine-color-gray-0)",
      borderColor: groupColor,
      borderStyle: "solid",
      ...focusStyles,
    };
  }

  if (exported) {
    return {
      ...baseStyles,
      background: "var(--mantine-color-gray-0)",
      borderColor: "var(--mantine-color-gray-5)",
      borderStyle: "dashed",
      ...focusStyles,
    };
  }

  if (!exported) {
    return {
      ...baseStyles,
      background: "var(--mantine-color-gray-0)",
      ...focusStyles,
    };
  }
}

function getProviderFocusStyles(focusClass: string) {
  switch (focusClass) {
    case "provider-focus-selected":
      return {
        "--badge-bg": "var(--graph-color-provider-focus-selected)",
        "--badge-bd": "2px solid var(--mantine-color-orange-4)",
        "--badge-color": "var(--mantine-color-gray-8)",
        background: "var(--graph-color-provider-focus-selected)",
        borderColor: "var(--mantine-color-orange-4)",
        borderStyle: "solid",
        borderWidth: 2,
        fontWeight: 700,
      };
    case "provider-focus-same":
      return {
        "--badge-bg": "var(--graph-color-provider-focus-same)",
        "--badge-bd": "1px solid #ffd8a8",
        "--badge-color": "var(--mantine-color-gray-8)",
        background: "var(--graph-color-provider-focus-same)",
        borderColor: "#ffd8a8",
        borderStyle: "solid",
        borderWidth: 1,
        fontWeight: 500,
      };
    case "provider-focus-dependant":
      return {
        "--badge-bg": "var(--graph-color-provider-focus-dependant)",
        "--badge-bd": "1px solid var(--mantine-color-yellow-5)",
        "--badge-color": "var(--mantine-color-gray-8)",
        background: "var(--graph-color-provider-focus-dependant)",
        borderColor: "var(--mantine-color-yellow-5)",
        borderStyle: "solid",
      };
    default:
      return {};
  }
}

function getProviderDependencyBadgeStyles(color: string | undefined) {
  return {
    background: "var(--mantine-color-gray-0)",
    borderColor: color ?? "transparent",
    borderStyle: "solid",
    color: "var(--mantine-color-gray-8)",
    justifyContent: "flex-start",
    maxWidth: "100%",
  };
}
