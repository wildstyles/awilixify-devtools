import {
  ActionIcon,
  Alert,
  Box,
  Group,
  TextInput,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import type { ChangeEvent } from "react";
import { useGraphSettings } from "../GraphSettingsContext";

type GraphToolbarProps = {
  error: string | null;
  onRefresh: () => void;
};

export function GraphToolbar({ error, onRefresh }: GraphToolbarProps) {
  const { searchInput, setSearchInput } = useGraphSettings();

  return (
    <Group justify="space-between" align="flex-start" gap="md">
      <Box>
        <Text c="dimmed" size="xs" fw={700} tt="uppercase">
          Module graph
        </Text>
        <Title id="graph-title" order={2}>
          Dependencies
        </Title>
      </Box>

      <TextInput
        placeholder="Search modules or providers"
        value={searchInput}
        w={{ base: "100%", sm: 340 }}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setSearchInput(event.currentTarget.value)
        }
      />

      <Group justify="flex-end" gap="xs">
        {error ? (
          <Alert color="red" variant="light" py={6} px="sm">
            <Text size="xs" maw={280} truncate="end">
              {error}
            </Text>
          </Alert>
        ) : null}
        <Tooltip label="Fetch graph again">
          <ActionIcon
            aria-label="Retry graph request"
            color="gray"
            size="lg"
            variant="default"
            onClick={onRefresh}
          >
            ↻
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
