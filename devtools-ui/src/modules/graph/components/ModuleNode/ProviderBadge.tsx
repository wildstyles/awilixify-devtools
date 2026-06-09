import { Badge, HoverCard } from "@mantine/core";
import clsx from "clsx";
import type { ModuleProviderImpact, LifetimeType } from "@/api/model/index";
import { useGraphSettings } from "../../GraphSettingsContext";
import type { ModuleFlowNode, ProviderImpactStatusByName } from "../../types";
import { HighlightedText } from "./HighlightedText";
import styles from "./ModuleNode.module.css";
import { ProviderDependencyList } from "./ProviderDependencyPopover";
import {
	AllowCircularIcon,
	EagerProviderIcon,
	LifetimeTypeIcon,
} from "./ProviderIcons";
import { ProviderStatusDot } from "./ProviderStatusDot";
import { getDependencyProviderColorByName } from "./ProviderGroup";

type ProviderSource = {
	providerAllowCircular: Record<string, boolean>;
	providerDependencies: Record<string, string[]>;
	providerEager: Record<string, boolean>;
	providerInitAfter: Record<string, string[]>;
	lifetimeTypes: Record<string, LifetimeType>;
};

export function ProviderBadge({
	color,
	exported,
	groupKey,
	impact,
	provider,
	source,
	data,
}: {
	data: ModuleFlowNode["data"];
	color?: string;
	exported: boolean;
	groupKey: string;
	impact: ModuleProviderImpact;
	provider: string;
	source: ProviderSource;
}) {
	const { searchQuery, setProviderFocus } = useGraphSettings();
	const occurrenceId = `${data.id}:${groupKey}:${provider}`;
	const focusClass = getProviderFocusClass(
		provider,
		occurrenceId,
		data.providerFocus,
	);

	const dependencyProviderColorByName = getDependencyProviderColorByName(
		data.importedProviderGroups,
	);
	const providerImpactStatusByName = buildStatusByName([
		data.impact,
		...data.importedProviderGroups.map((g) => g.impact),
	]);

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
					className={clsx(styles.providerDepsTrigger, styles[focusClass])}
					onClick={(event) => {
						event.stopPropagation();
						setProviderFocus(
							data.providerFocus?.provider === provider &&
								data.providerFocus.occurrenceId === occurrenceId
								? null
								: { occurrenceId, provider },
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
						root: getProviderChipStyles(exported, color, focusClass),
					}}
					variant="light"
				>
					<ProviderStatusDot
						added={impact.added.includes(provider)}
						affected={impact.affected.includes(provider)}
						changed={impact.changed.includes(provider)}
						deleted={impact.deleted.includes(provider)}
					/>
					<HighlightedText query={searchQuery} text={provider} />
					{source.providerAllowCircular[provider] && <AllowCircularIcon />}
					{source.providerEager[provider] && <EagerProviderIcon />}
					<LifetimeTypeIcon lifetime={source.lifetimeTypes[provider]} />
				</Badge>
			</HoverCard.Target>
			<HoverCard.Dropdown
				className={styles.providerDepsPopover}
				onClick={(event) => event.stopPropagation()}
				onPointerDown={(event) => event.stopPropagation()}
			>
				<ProviderDependencyList
					dependencyProviderColorByName={dependencyProviderColorByName}
					dependencies={source.providerDependencies[provider] ?? []}
					initAfter={source.providerInitAfter[provider] ?? []}
					providerImpactStatusByName={providerImpactStatusByName}
					lifetimeTypes={source.lifetimeTypes}
					searchQuery={searchQuery}
				/>
			</HoverCard.Dropdown>
		</HoverCard>
	);
}

type ProviderFocusClass =
	| "providerFocusDependant"
	| "providerFocusDimmed"
	| "providerFocusSame"
	| "providerFocusSelected"
	| "";

function getProviderFocusClass(
	provider: string,
	occurrenceId: string,
	providerFocus: ModuleFlowNode["data"]["providerFocus"],
): ProviderFocusClass {
	if (!providerFocus) return "";

	if (provider === providerFocus.provider) {
		return occurrenceId === providerFocus.occurrenceId
			? "providerFocusSelected"
			: "providerFocusSame";
	}
	if (providerFocus.dependants.includes(provider)) {
		return "providerFocusDependant";
	}

	return "providerFocusDimmed";
}

function getProviderChipStyles(
	exported: boolean,
	groupColor: string | undefined,
	focusClass: ProviderFocusClass,
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

	return {
		...baseStyles,
		background: "var(--mantine-color-gray-0)",
		...focusStyles,
	};
}

function getProviderFocusStyles(focusClass: ProviderFocusClass) {
	switch (focusClass) {
		case "providerFocusSelected":
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
		case "providerFocusSame":
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
		case "providerFocusDependant":
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

function buildStatusByName(
	impacts: ModuleProviderImpact[],
): ProviderImpactStatusByName {
	const byName: ProviderImpactStatusByName = {};

	for (const impact of impacts) {
		for (const provider of impact.affected) {
			byName[provider] = "affected";
		}
		for (const provider of impact.changed) {
			byName[provider] = "changed";
		}
		for (const provider of impact.added) {
			byName[provider] = "new";
		}
		for (const provider of impact.deleted) {
			byName[provider] = "deleted";
		}
	}

	return byName;
}
