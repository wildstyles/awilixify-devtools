import {
	Alert,
	Badge,
	Button,
	Code,
	Group,
	Select,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import type { ProviderOccurrence, SelectOption } from "../types";
import { useGetDevtoolsPlaygroundMethods } from "@/api/playground/playground.js";

type PlaygroundControlsProps = {
	argsText: string;
	invocationPreview: string;
	moduleOptions: SelectOption[];
	onArgsTextChange: (value: string) => void;
	onMethodChange: (value: string | null) => void;
	onModuleChange: (value: string | null) => void;
	onProviderChange: (value: string | null) => void;
	onRun: () => void;
	providerOptions: SelectOption[];
	running: boolean;
	selectedMethod: string | null;
	selectedProvider: ProviderOccurrence | null;
	selectedProviderKey: string | null;
	selectedScopeModuleId: string | null;
};

export function PlaygroundControls({
	argsText,
	invocationPreview,
	moduleOptions,
	onArgsTextChange,
	onMethodChange,
	onModuleChange,
	onProviderChange,
	onRun,
	providerOptions,
	running,
	selectedMethod,
	selectedProvider,
	selectedProviderKey,
	selectedScopeModuleId,
}: PlaygroundControlsProps) {
	const methodsQuery = useGetDevtoolsPlaygroundMethods(
		{
			scopeModuleId: selectedProvider?.scopeModuleId ?? "",
			providerKey: selectedProvider?.providerKey ?? "",
		},
		{
			query: {
				enabled: !!selectedProvider,
			},
		},
	);
	const methods = methodsQuery.data?.methods ?? [];
	const methodError = methodsQuery.error
		? methodsQuery.error instanceof Error
			? methodsQuery.error.message
			: String(methodsQuery.error)
		: null;

	return (
		<Stack gap="md">
			<Group align="flex-start" grow wrap="nowrap">
				<Select
					clearable
					data={moduleOptions}
					label="Module"
					nothingFoundMessage="No modules"
					onChange={onModuleChange}
					placeholder="Select module scope"
					searchable
					value={selectedScopeModuleId}
				/>

				<Select
					clearable
					data={providerOptions}
					label="Provider"
					nothingFoundMessage="No providers"
					onChange={onProviderChange}
					placeholder="Select provider"
					searchable
					value={selectedProviderKey}
				/>

				<Select
					clearable
					data={methods}
					disabled={!selectedProvider || Boolean(methodError)}
					label="Method"
					nothingFoundMessage="No methods"
					onChange={onMethodChange}
					placeholder="Select method"
					searchable
					value={selectedMethod}
				/>
			</Group>

			{selectedProvider && (
				<Group gap="xs">
					<Badge color="teal" variant="light">
						scope {selectedProvider.scopeModuleName}
					</Badge>
					<Badge color="gray" variant="light">
						from {selectedProvider.ownerModuleName}
					</Badge>
				</Group>
			)}

			{methodError && (
				<Alert color="red" title="Cannot inspect provider">
					{methodError}
				</Alert>
			)}

			<Stack gap={6}>
				<Text fw={700} size="sm">
					Invocation
				</Text>
				<Group gap="sm" wrap="nowrap">
					<Code block style={{ flex: 1 }}>
						{invocationPreview}
					</Code>
					<Button
						disabled={!selectedProvider || !selectedMethod}
						loading={running}
						onClick={onRun}
					>
						Run
					</Button>
				</Group>
			</Stack>

			<Textarea
				autosize
				label="Arguments"
				minRows={4}
				onChange={(event) => onArgsTextChange(event.currentTarget.value)}
				placeholder={'"arg1", "arg2"'}
				spellCheck={false}
				value={argsText}
			/>
		</Stack>
	);
}
