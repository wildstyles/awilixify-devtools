import {
  Badge,
  Box,
  Code,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { ModuleGraphNode } from "../../../graph/graph.types";
import type {
  ModuleFlowEdge,
  ModuleFlowNode,
  ModuleNodeData,
} from "../../../graph/toFlowGraph";

type ModuleInspectorProps = {
  edges: ModuleFlowEdge[];
  module: ModuleNodeData | null;
  nodes: ModuleFlowNode[];
};

export function ModuleInspector({
  edges,
  module,
  nodes,
}: ModuleInspectorProps) {
  if (!module) {
    return null;
  }

  const nodeNameById = new Map(nodes.map((node) => [node.id, node.data.name]));
  const outgoing = edges.filter((edge) => edge.source === module.id);
  const incoming = edges.filter((edge) => edge.target === module.id);
  const importEdges = outgoing.filter((edge) => edge.data?.type === "imports");
  const globalEdges = outgoing.filter((edge) => edge.data?.type === "global");

  return (
    <Stack gap="md" aria-label="Module inspector">
      <Box>
        <Badge color={getKindColor(module.kind)} variant="light">
          {module.kind}
        </Badge>
        <Title order={3} size="h4" mt={6}>
          {module.name}
        </Title>
      </Box>

      <Stack gap={8}>
        <StatRow label="Providers" value={module.providers.length} />
        <StatRow label="Controllers" value={module.controllers.length} />
        <StatRow label="Imports" value={importEdges.length} />
        <StatRow label="Globals" value={globalEdges.length} />
        <StatRow label="Used by" value={incoming.length} />
        <StatRow label="Instances" value={module.instanceCount} />
      </Stack>

      <Divider />

      <FeatureList title="Providers" items={module.providers} />
      <FeatureList title="Controllers" items={module.controllers} />
      <FeatureList
        title="Handlers"
        items={[...module.queryHandlers, ...module.commandHandlers]}
      />
      <FeatureList
        title="Imports"
        items={importEdges.map(
          (edge) => nodeNameById.get(edge.target) ?? edge.target,
        )}
      />
      <FeatureList
        title="Globals"
        items={globalEdges.map(
          (edge) => nodeNameById.get(edge.target) ?? edge.target,
        )}
      />
      <ModuleInstances instances={module.instances} />
    </Stack>
  );
}

function ModuleInstances({ instances }: { instances: ModuleGraphNode[] }) {
  if (instances.length <= 1 && !instances[0]?.dynamic) return null;

  return (
    <Stack gap={8}>
      <Text fw={700} size="sm">
        Instances
      </Text>
      <ScrollArea.Autosize mah={220} type="auto">
        <Stack gap={8}>
          {instances.map((instance) => (
            <Code key={instance.id} block>
              {formatInstance(instance)}
            </Code>
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
}

function formatInstance(instance: ModuleGraphNode): string {
  const lines = [instance.name];

  if (instance.dynamic) {
    lines.push(`hash: ${instance.dynamic.hash}`);
    if (instance.dynamic.paramsPreview) {
      lines.push(`params: ${instance.dynamic.paramsPreview}`);
    }
  }

  return lines.join("\n");
}

function FeatureList({ title, items }: { title: string; items: string[] }) {
  return (
    <Stack gap={8}>
      <Text fw={700} size="sm">
        {title}
      </Text>
      {items.length > 0 ? (
        <ScrollArea.Autosize mah={150} type="auto">
          <Stack gap={6}>
            {items.map((item) => (
              <Code key={item} block>
                {item}
              </Code>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      ) : (
        <Text c="dimmed" size="sm">
          None
        </Text>
      )}
    </Stack>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <Group justify="space-between" gap="md">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text fw={700}>{value}</Text>
    </Group>
  );
}

function getKindColor(kind: ModuleGraphNode["kind"]) {
  if (kind === "root") return "teal";
  if (kind === "global") return "blue";
  if (kind === "internal") return "yellow";

  return "gray";
}
