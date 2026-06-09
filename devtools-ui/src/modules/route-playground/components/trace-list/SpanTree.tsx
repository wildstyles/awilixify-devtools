import { CodeHighlight } from "@mantine/code-highlight";
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Collapse,
	Group,
	HoverCard,
	ScrollArea,
	Stack,
	Text,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import type { TraceSpan } from "@/api/model/index.js";
import { getSpanColor } from "../trace-tree/traceFormatting";
import { getDisplayArgs } from "./SpanDetails";

type SpanTreeNode = TraceSpan & {
	children: SpanTreeNode[];
};

type SpanTreeProps = {
	onSelect: (spanId: string) => void;
	selectedSpanId: string | null;
	spans: TraceSpan[];
};

export function SpanTree({ onSelect, selectedSpanId, spans }: SpanTreeProps) {
	const spanTree = useMemo(() => {
		const byId = new Map<string, SpanTreeNode>();

		for (const span of spans) {
			byId.set(span.id, { ...span, children: [] });
		}

		// Build visual tree: only providers nest under other providers
		const roots: SpanTreeNode[] = [];

		for (const span of byId.values()) {
			const parent = span.parentId ? byId.get(span.parentId) : null;

			// Only nest if BOTH this span and parent are providers
			const shouldNest =
				span.kind === "provider" && parent?.kind === "provider";

			if (shouldNest && parent) {
				parent.children.push(span);
				continue;
			}

			roots.push(span);
		}

		// Sort roots by startedAt for correct timeline order
		roots.sort((a, b) => a.startedAt - b.startedAt);

		return roots;
	}, [spans]);
	const rootIds = useMemo(() => spanTree.map((span) => span.id), [spanTree]);
	const expandableIds = useMemo(
		() => getExpandableSpanIds(spanTree),
		[spanTree],
	);
	const [expandedSpanIds, setExpandedSpanIds] = useState<Set<string>>(
		() => new Set(rootIds),
	);

	useEffect(() => {
		setExpandedSpanIds(new Set(rootIds));
	}, [rootIds]);

	const toggleExpanded = (spanId: string) => {
		setExpandedSpanIds((current) => {
			const next = new Set(current);
			if (next.has(spanId)) {
				next.delete(spanId);
			} else {
				next.add(spanId);
			}

			return next;
		});
	};
	const expandAll = () => setExpandedSpanIds(new Set(expandableIds));
	const collapseAll = () => setExpandedSpanIds(new Set());

	const SpanRow = ({
		moduleName,
		span,
	}: {
		moduleName: string | null;
		span: SpanTreeNode;
	}) => {
		const selected = selectedSpanId === span.id;
		const hasChildren = span.children.length > 0;
		const expanded = expandedSpanIds.has(span.id);
		const decoratorInfo = getInterceptorDecoratorInfo(span);

		return (
			<Stack gap={4}>
				<Group
					bg={selected ? "teal.0" : "gray.0"}
					gap="xs"
					onClick={() => onSelect(span.id)}
					p={6}
					style={{
						border: selected
							? "1px solid var(--mantine-color-teal-4)"
							: "1px solid var(--mantine-color-gray-2)",
						borderRadius: 6,
						cursor: "pointer",
					}}
					wrap="nowrap"
				>
					{hasChildren ? (
						<ActionIcon
							aria-label={expanded ? "Collapse span" : "Expand span"}
							onClick={(event) => {
								event.stopPropagation();
								toggleExpanded(span.id);
							}}
							size="sm"
							variant="subtle"
						>
							{expanded ? "-" : "+"}
						</ActionIcon>
					) : (
						<Box h={22} w={22} />
					)}
					<Badge
						styles={{ label: { textTransform: "none" } }}
						color={getSpanColor(span.kind)}
						size="sm"
						variant="light"
					>
						{span.providerKey}
					</Badge>
					{decoratorInfo && (
						<DecoratorBadge
							decoratorName={decoratorInfo.decoratorName}
							metadata={decoratorInfo.metadata}
						/>
					)}
					<MethodName
						methodName={span.methodName}
						args={getDisplayArgs(span)}
					/>
					<Text c="dimmed" ml="auto" size="xs">
						{Math.round(span.durationMs)} ms
					</Text>
				</Group>
				{hasChildren && (
					<Collapse in={expanded}>
						<SpanChildren parentModuleName={moduleName} spans={span.children} />
					</Collapse>
				)}
			</Stack>
		);
	};

	const SpanChildren = ({
		parentModuleName,
		spans,
		isRoot = false,
	}: {
		parentModuleName: string | null;
		spans: SpanTreeNode[];
		isRoot?: boolean;
	}) => {
		const groups = groupSpansByModule(spans, parentModuleName);

		return (
			<Stack gap={4} ml={isRoot ? 0 : "md"}>
				{groups.map((group, index) => {
					const prevGroup = groups[index - 1];
					const showHeader =
						group.moduleName !== parentModuleName ||
						(prevGroup && prevGroup.moduleName !== group.moduleName);

					return (
						<Stack gap={4} key={group.key}>
							{showHeader && (
								<Text c="dimmed" fw={700} size="xs">
									{group.moduleName}
								</Text>
							)}
							{group.spans.map((span) => (
								<SpanRow
									key={span.id}
									moduleName={group.moduleName}
									span={span}
								/>
							))}
						</Stack>
					);
				})}
			</Stack>
		);
	};

	return (
		<Stack gap={6} style={{ height: "100%", minHeight: 0 }}>
			<Group gap="xs" justify="flex-end">
				<Button
					disabled={expandableIds.length === 0}
					onClick={expandAll}
					size="xs"
					variant="subtle"
				>
					Expand all
				</Button>
				<Button
					disabled={expandableIds.length === 0}
					onClick={collapseAll}
					size="xs"
					variant="subtle"
				>
					Collapse all
				</Button>
			</Group>
			<ScrollArea
				style={{ flex: 1, height: "100%", minHeight: 0 }}
				styles={{ viewport: { height: "100%", paddingRight: 12 } }}
				type="auto"
			>
				<SpanChildren isRoot parentModuleName={null} spans={spanTree} />
			</ScrollArea>
		</Stack>
	);
}

function getExpandableSpanIds(spans: SpanTreeNode[]) {
	const ids: string[] = [];

	for (const span of spans) {
		if (span.children.length > 0) {
			ids.push(span.id);
		}

		ids.push(...getExpandableSpanIds(span.children));
	}

	return ids;
}

type SpanGroup = {
	key: string;
	moduleName: string | null;
	spans: SpanTreeNode[];
};

function groupSpansByModule(
	spans: SpanTreeNode[],
	parentModuleName: string | null,
): SpanGroup[] {
	const groups: SpanGroup[] = [];

	for (const span of spans) {
		const moduleName = span.moduleName ?? parentModuleName;
		const lastGroup = groups[groups.length - 1];

		if (lastGroup && lastGroup.moduleName === moduleName) {
			lastGroup.spans.push(span);
		} else {
			groups.push({
				key: `${moduleName}-${span.id}`,
				moduleName,
				spans: [span],
			});
		}
	}

	return groups;
}

function formatMethodCall(methodName: string, args: unknown[]): string {
	if (!args || args.length === 0) return `${methodName}()`;

	const formattedArgs = args
		.map((arg) => JSON.stringify(arg, null, 2))
		.join(", ");

	return `${methodName}(${formattedArgs})`;
}

function MethodName({
	methodName,
	args,
}: {
	methodName: string;
	args: unknown[];
}) {
	const hasArgs = args && args.length > 0;

	if (!hasArgs) {
		return (
			<Text size="sm" style={{ minWidth: 0 }}>
				{methodName}
				<Text span c="dimmed">
					()
				</Text>
			</Text>
		);
	}

	return (
		<HoverCard shadow="md" position="bottom-start" withArrow>
			<HoverCard.Target>
				<Text size="sm" style={{ minWidth: 0, cursor: "help" }}>
					{methodName}
					<Text span c="dimmed">
						(...)
					</Text>
				</Text>
			</HoverCard.Target>
			<HoverCard.Dropdown
				style={{
					maxWidth: 600,
					maxHeight: 300,
					overflow: "auto",
					background: "var(--mantine-color-gray-0)",
				}}
			>
				<CodeHighlight
					code={formatMethodCall(methodName, args)}
					language="typescript"
					withCopyButton={false}
				/>
			</HoverCard.Dropdown>
		</HoverCard>
	);
}

type InterceptorDecoratorInfo = {
	decoratorName: string;
	metadata: unknown;
};

function getInterceptorDecoratorInfo(
	span: SpanTreeNode,
): InterceptorDecoratorInfo | null {
	if (span.kind !== "interceptor") return null;

	const context = span.args?.[0] as
		| { decoratorName?: string; metadata?: unknown }
		| undefined;

	if (!context?.decoratorName) return null;

	return {
		decoratorName: context.decoratorName,
		metadata: context.metadata,
	};
}

/**
 * Extracts decorator arguments from metadata.
 * For { timeoutMs: 3000 } returns [3000]
 * For { retry: { maxAttempts: 3 } } returns [{ maxAttempts: 3 }]
 */
function extractArgsFromMetadata(metadata: unknown): unknown[] {
	if (!metadata || typeof metadata !== "object") return [];

	const values = Object.values(metadata as Record<string, unknown>);

	if (values.length === 0) return [];

	return values;
}

function formatDecoratorCall(name: string, metadata: unknown): string {
	const args = extractArgsFromMetadata(metadata);

	if (args.length === 0) {
		return `@${name}()`;
	}

	const formattedArgs = args
		.map((arg) => JSON.stringify(arg, null, 2))
		.join(", ");

	return `@${name}(${formattedArgs})`;
}

function DecoratorBadge({
	decoratorName,
	metadata,
}: {
	decoratorName: string;
	metadata: unknown;
}) {
	const args = extractArgsFromMetadata(metadata);
	const hasArgs = args.length > 0;

	if (!hasArgs) {
		return (
			<Badge
				styles={{ label: { textTransform: "none" } }}
				color="orange"
				size="sm"
				variant="outline"
			>
				@{decoratorName}()
			</Badge>
		);
	}

	return (
		<HoverCard shadow="md" position="bottom-start" withArrow>
			<HoverCard.Target>
				<Badge
					styles={{ label: { textTransform: "none", cursor: "help" } }}
					color="orange"
					size="sm"
					variant="outline"
				>
					@{decoratorName}(...)
				</Badge>
			</HoverCard.Target>
			<HoverCard.Dropdown
				style={{
					maxWidth: 600,
					maxHeight: 300,
					overflow: "auto",
					background: "var(--mantine-color-gray-0)",
				}}
			>
				<CodeHighlight
					code={formatDecoratorCall(decoratorName, metadata)}
					language="typescript"
					withCopyButton={false}
				/>
			</HoverCard.Dropdown>
		</HoverCard>
	);
}
