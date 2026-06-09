import {
	Alert,
	Divider,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useGetDevtoolsGraph } from "../../api/graph/graph.js";
import type { InvokeProviderResponse } from "@/api/model/index.js";
import { usePostDevtoolsPlaygroundInvoke } from "../../api/playground/playground.js";
import { ConsolePanel } from "./components/ConsolePanel";
import { PlaygroundControls } from "./components/PlaygroundControls";
import { ResultPanel } from "./components/ResultPanel";
import {
	getModuleOptions,
	getProviderOccurrences,
	getProviderOptions,
	getSelectedProviderOccurrence,
} from "./providerPlaygroundData";

export function ProviderPlaygroundView() {
	const graphQuery = useGetDevtoolsGraph();
	const graph = graphQuery.data ?? null;
	const graphError = graphQuery.error
		? graphQuery.error instanceof Error
			? graphQuery.error.message
			: String(graphQuery.error)
		: null;
	const [selectedScopeModuleId, setSelectedScopeModuleId] = useState<
		string | null
	>(null);
	const [selectedProviderKey, setSelectedProviderKey] = useState<string | null>(
		null,
	);
	const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
	const [argsText, setArgsText] = useState("");
	const [result, setResult] = useState<InvokeProviderResponse | null>(null);

	const providers = useMemo(
		() => (graph ? getProviderOccurrences(graph) : []),
		[graph],
	);
	const moduleOptions = useMemo(
		() =>
			graph ? getModuleOptions(graph, providers, selectedProviderKey) : [],
		[graph, providers, selectedProviderKey],
	);
	const providerOptions = useMemo(
		() => getProviderOptions(providers, selectedScopeModuleId),
		[providers, selectedScopeModuleId],
	);
	const selectedProvider = getSelectedProviderOccurrence(
		providers,
		selectedScopeModuleId,
		selectedProviderKey,
	);

	const invokeMutation = usePostDevtoolsPlaygroundInvoke();

	useEffect(() => {
		if (!selectedScopeModuleId) return;
		if (
			moduleOptions.some(
				(moduleOption) => moduleOption.value === selectedScopeModuleId,
			)
		) {
			return;
		}

		setSelectedScopeModuleId(null);
	}, [moduleOptions, selectedScopeModuleId]);

	useEffect(() => {
		if (!selectedProviderKey) return;
		if (
			providerOptions.some(
				(providerOption) => providerOption.value === selectedProviderKey,
			)
		) {
			return;
		}

		setSelectedProviderKey(null);
	}, [providerOptions, selectedProviderKey]);

	// Reset selected method when provider changes
	useEffect(() => {
		setSelectedMethod(null);
	}, [selectedProvider?.scopeModuleId, selectedProvider?.providerKey]);

	const invocationPreview = selectedProvider
		? `${selectedProvider.providerKey}.${selectedMethod ?? "<method>"}(${argsText || ""})`
		: "provider.method()";

	const selectProvider = (providerKey: string | null) => {
		setSelectedProviderKey(providerKey);

		if (!providerKey || selectedScopeModuleId) return;

		const ownerOccurrence = providers.find(
			(provider) =>
				provider.providerKey === providerKey &&
				provider.scopeModuleId === provider.ownerModuleId,
		);

		setSelectedScopeModuleId(
			ownerOccurrence?.ownerModuleId ??
				providers.find((provider) => provider.providerKey === providerKey)
					?.scopeModuleId ??
				null,
		);
	};

	const runInvocation = async () => {
		if (!selectedProvider || !selectedMethod) return;

		let args: unknown[];
		try {
			// Wrap user input in brackets to create array
			args = JSON.parse(`[${argsText}]`);
		} catch (error) {
			setResult({
				ok: false,
				error: {
					name: "Invalid JSON",
					message: error instanceof Error ? error.message : String(error),
				},
				console: [],
			});
			return;
		}

		try {
			const response = await invokeMutation.mutateAsync({
				data: {
					scopeModuleId: selectedProvider.scopeModuleId,
					providerKey: selectedProvider.providerKey,
					methodName: selectedMethod,
					args,
				},
			});
			setResult(response);
		} catch (error) {
			setResult({
				ok: false,
				error: {
					name: "Request failed",
					message: error instanceof Error ? error.message : String(error),
				},
				console: [],
			});
		}
	};

	return (
		<Stack gap="md">
			<Group align="flex-start" justify="space-between">
				<Stack gap={2}>
					<Title order={2}>Provider playground</Title>
					<Text c="dimmed" size="sm">
						Invoke live providers from a selected module scope.
					</Text>
				</Stack>
			</Group>

			{graphError && (
				<Alert color="red" title="Module graph unavailable">
					{graphError}
				</Alert>
			)}

			<Grid gutter="md">
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Paper withBorder radius="sm" p="md">
						<PlaygroundControls
							argsText={argsText}
							invocationPreview={invocationPreview}
							moduleOptions={moduleOptions}
							onArgsTextChange={setArgsText}
							onMethodChange={setSelectedMethod}
							onModuleChange={setSelectedScopeModuleId}
							onProviderChange={selectProvider}
							onRun={runInvocation}
							providerOptions={providerOptions}
							running={invokeMutation.isPending}
							selectedMethod={selectedMethod}
							selectedProvider={selectedProvider}
							selectedProviderKey={selectedProviderKey}
							selectedScopeModuleId={selectedScopeModuleId}
						/>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 6 }}>
					<Paper withBorder radius="sm" p="md">
						<Stack gap="md">
							<ResultPanel result={result} />
							<Divider />
							<ConsolePanel result={result} />
						</Stack>
					</Paper>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
