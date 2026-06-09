import {
	Badge,
	Box,
	Code,
	Divider,
	Group,
	HoverCard,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import { useGetDevtoolsGraphModulesModuleId } from "@/api/graph/graph";
import type {
	GetModuleDetailsResponse,
	ModuleGraphNodeBase,
	ModuleGraphNode,
} from "@/api/model";
import type { ModuleNodeData } from "../../types";
import {
	getDependencyProviderColorByName,
	ProviderGroup,
} from "../ModuleNode/ProviderGroup";

type ModuleInspectorProps = {
	module: ModuleNodeData | null;
};

export function ModuleInspector({ module }: ModuleInspectorProps) {
	const detailsQuery = useGetDevtoolsGraphModulesModuleId(module?.id ?? "", {
		query: { enabled: module !== null },
	});

	if (!module) {
		return null;
	}

	const details = detailsQuery.data ?? emptyModuleDetails(module);
	const dependencyProviderColorByName = getDependencyProviderColorByName(
		module.importedProviderGroups,
	);

	return (
		<Stack gap="md" aria-label="Module inspector">
			<Stack gap={8}>
				<StatRow
					details={module.providers}
					detailsTitle="Providers"
					label="Providers"
					value={module.providers.length}
				/>
				<StatRow
					details={module.controllers}
					detailsTitle="Controllers"
					label="Controllers"
					value={module.controllers.length}
				/>
				<StatRow
					details={details.importedModules}
					detailsTitle="Imported modules"
					label="Imports"
					value={details.importedModules.length}
				/>
				<StatRow
					details={details.globalModules}
					detailsTitle="Global modules"
					label="Globals"
					value={details.globalModules.length}
				/>
				<StatRow
					details={details.usedByModules}
					detailsTitle="Used by modules"
					label="Used by"
					value={details.usedByModules.length}
				/>
				<StatRow
					details={details.availableInterceptors}
					detailsTitle="Available interceptors"
					label="Interceptors"
					value={details.availableInterceptors.length}
				/>
				<StatRow
					details={details.availableQueryPreHandlers}
					detailsTitle="Available query prehandlers"
					label="Query prehandlers"
					value={details.availableQueryPreHandlers.length}
				/>
				<StatRow
					details={details.availableCommandPreHandlers}
					detailsTitle="Available command prehandlers"
					label="Command prehandlers"
					value={details.availableCommandPreHandlers.length}
				/>
				<StatRow
					details={details.availableInitializers}
					detailsTitle="Available initializers"
					label="Initializers"
					value={details.availableInitializers.length}
				/>
				<StatRow
					details={module.instances.map(formatInstance)}
					detailsTitle="Instances"
					label="Instances"
					value={module.instanceCount}
				/>
			</Stack>

			<Divider />

			<RouteSections routes={details.routes} />

			<Divider />

			<ProviderSections
				data={module}
				dependencyProviderColorByName={dependencyProviderColorByName}
			/>
		</Stack>
	);
}

function RouteSections({ routes }: { routes: ModuleGraphNode["routes"] }) {
	const formatRouteKey = (route: ModuleGraphNode["routes"][number]) =>
		`${route.method}:${route.path}:${route.controller}:${route.handler}`;

	const getMethodBadgeColor = (method: string) => {
		switch (method) {
			case "GET":
				return "green";
			case "POST":
				return "blue";
			case "PUT":
				return "yellow";
			case "PATCH":
				return "orange";
			case "DELETE":
				return "red";
			default:
				return "gray";
		}
	};

	return (
		<Stack gap={8}>
			<Group justify="space-between" gap="sm">
				<Text fw={700} size="sm">
					Routes
				</Text>
				<Text c="dimmed" fw={700} size="sm">
					{routes.length}
				</Text>
			</Group>
			{routes.length > 0 && (
				<ScrollArea.Autosize mah={180} type="auto">
					<Stack gap={8}>
						{routes.map((route) => (
							<Group
								align="center"
								gap={8}
								key={formatRouteKey(route)}
								p={6}
								style={{
									background: "var(--mantine-color-gray-0)",
									border: "1px solid var(--mantine-color-gray-2)",
									borderRadius: 6,
									minHeight: 34,
								}}
								wrap="nowrap"
							>
								<Badge
									color={getMethodBadgeColor(route.method)}
									miw={58}
									radius="sm"
									size="md"
									variant="light"
								>
									{route.method}
								</Badge>
								<PrettyRoutePath path={route.path} />
							</Group>
						))}
					</Stack>
				</ScrollArea.Autosize>
			)}

			{!routes.length && (
				<Text c="dimmed" size="sm">
					No HTTP routes
				</Text>
			)}
		</Stack>
	);
}

function PrettyRoutePath({ path }: { path: string }) {
	const parts = path.split(/(:[A-Za-z0-9_]+)/g);
	const partOccurrences = new Map<string, number>();

	return (
		<Text
			component="code"
			size="sm"
			style={{
				alignItems: "center",
				display: "inline-flex",
				fontFamily: "var(--mantine-font-family-monospace)",
				lineHeight: 1,
				minHeight: 22,
				overflowWrap: "anywhere",
				wordBreak: "break-word",
			}}
		>
			{parts.map((part) => {
				const occurrence = partOccurrences.get(part) ?? 0;
				partOccurrences.set(part, occurrence + 1);
				const key = `${part}-${occurrence}`;

				return part.startsWith(":") ? (
					<Text c="teal" component="span" fw={700} inherit key={key}>
						{part}
					</Text>
				) : (
					<Text component="span" inherit key={key}>
						{part}
					</Text>
				);
			})}
		</Text>
	);
}

function ProviderSections({
	data,
	dependencyProviderColorByName,
}: {
	data: ModuleNodeData;
	dependencyProviderColorByName: Record<string, string>;
}) {
	return (
		<Stack gap={8}>
			<Text fw={700} size="sm">
				Providers
			</Text>
			<ScrollArea.Autosize mah={260} type="auto">
				<Stack gap={8}>
					<ProviderGroup
						data={data}
						dependencyProviderColorByName={dependencyProviderColorByName}
						groupKey="own"
						showHandles={false}
					/>
					{data.importedProviderGroups.map((group) => (
						<ProviderGroup
							data={data}
							dependencyProviderColorByName={dependencyProviderColorByName}
							group={group}
							groupKey={group.moduleId}
							key={group.moduleId}
							showHandles={false}
						/>
					))}
				</Stack>
			</ScrollArea.Autosize>
		</Stack>
	);
}

function formatInstance(instance: ModuleGraphNodeBase): string {
	const lines = [instance.name];

	if (instance.dynamic) {
		lines.push(`hash: ${instance.dynamic.hash}`);
		if (instance.dynamic.paramsPreview) {
			lines.push(`params: ${instance.dynamic.paramsPreview}`);
		}
	}

	return lines.join("\n");
}

function StatRow({
	details,
	detailsTitle,
	label,
	value,
}: {
	details?: string[];
	detailsTitle?: string;
	label: string;
	value: number;
}) {
	const hasDetails = Boolean(details?.length);

	return (
		<Group justify="space-between" gap="md">
			<Group gap={6}>
				<Text c="dimmed" size="sm">
					{label}
				</Text>
				{hasDetails && (
					<HoverCard
						openDelay={150}
						position="right-start"
						shadow="md"
						withArrow
					>
						<HoverCard.Target>
							<Box
								aria-label={`Show ${label.toLowerCase()} details`}
								component="span"
								style={{
									alignItems: "center",
									border: "1px solid var(--mantine-color-gray-4)",
									borderRadius: 999,
									color: "var(--mantine-color-gray-6)",
									cursor: "help",
									display: "inline-flex",
									fontSize: 10,
									fontWeight: 700,
									height: 16,
									justifyContent: "center",
									lineHeight: 1,
									width: 16,
								}}
							>
								i
							</Box>
						</HoverCard.Target>
						<HoverCard.Dropdown style={{ maxWidth: 300, padding: 8 }}>
							<Stack gap={6}>
								<Text c="dimmed" fw={700} size="xs">
									{detailsTitle ?? label}
								</Text>
								<ScrollArea.Autosize mah={180} type="auto">
									<Stack gap={4}>
										{details?.map((item) => (
											<Code key={item} block>
												{item}
											</Code>
										))}
									</Stack>
								</ScrollArea.Autosize>
							</Stack>
						</HoverCard.Dropdown>
					</HoverCard>
				)}
			</Group>
			<Text fw={700}>{value}</Text>
		</Group>
	);
}

function emptyModuleDetails(module: ModuleNodeData): GetModuleDetailsResponse {
	return {
		availableCommandPreHandlers: module.commandPreHandlers,
		availableInitializers: module.initializers,
		availableInterceptors: module.interceptors,
		availableQueryPreHandlers: module.queryPreHandlers,
		globalModules: [],
		importedModules: [],
		module: module as unknown as GetModuleDetailsResponse["module"],
		routes: module.routes,
		usedByModules: [],
	};
}
