import { Badge, Stack, Text } from "@mantine/core";
import type { ProviderImpactStatusByName } from "../../types";
import type { LifetimeType } from "@/api/model";
import { HighlightedText } from "./HighlightedText";
import styles from "./ModuleNode.module.css";
import { LifetimeTypeIcon } from "./ProviderIcons";
import { ProviderStatusDot } from "./ProviderStatusDot";

export function ProviderDependencyList({
	dependencyProviderColorByName,
	dependencies,
	initAfter,
	providerImpactStatusByName,
	lifetimeTypes,
	searchQuery,
}: {
	dependencyProviderColorByName: Record<string, string>;
	dependencies: string[];
	initAfter: string[];
	providerImpactStatusByName: ProviderImpactStatusByName;
	lifetimeTypes: Record<string, LifetimeType>;
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
				lifetimeTypes={lifetimeTypes}
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
						lifetimeTypes={lifetimeTypes}
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
	lifetimeTypes,
	providers,
	searchQuery,
}: {
	dependencyProviderColorByName: Record<string, string>;
	providerImpactStatusByName: ProviderImpactStatusByName;
	lifetimeTypes: Record<string, LifetimeType>;
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
					className={styles.providerDependencyBadge}
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
					<LifetimeTypeIcon lifetime={lifetimeTypes[provider]} />
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
