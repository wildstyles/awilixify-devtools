import { Box, Group, Text, TextInput, Title } from "@mantine/core";
import type { ChangeEvent } from "react";

import { useGraphSettings } from "../GraphSettingsContext";

export function GraphToolbar() {
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
		</Group>
	);
}
