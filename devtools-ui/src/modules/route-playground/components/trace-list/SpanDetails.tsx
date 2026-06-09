import { CodeHighlight } from "@mantine/code-highlight";
import { ScrollArea, Stack, Text } from "@mantine/core";
import type { TraceSpan } from "@/api/model/index.js";
import { stringifyPretty } from "../../../provider-playground/stringifyPretty";
import { formatSpanLabel } from "../trace-tree/traceFormatting";

function formatMethodCall(methodName: string, args: unknown[]): string {
	if (!args || args.length === 0) return `${methodName}()`;

	const formattedArgs = args
		.map((arg) => JSON.stringify(arg, null, 2))
		.join(", ");

	return `${methodName}(${formattedArgs})`;
}

/**
 * For interceptor spans, filters out devtools-only field (decoratorName)
 * from the trace context to show clean data in the details view.
 */
export function getDisplayArgs(span: TraceSpan): unknown[] {
	if (span.kind !== "interceptor") {
		return span.args;
	}

	const context = span.args[0];

	if (!context || typeof context !== "object") {
		return span.args;
	}

	const { decoratorName, ...cleanContext } = context as Record<string, unknown>;

	return [cleanContext, ...span.args.slice(1)];
}

type ConsoleEntry = {
	level: "log" | "info" | "warn" | "error";
	args: unknown[];
};

type SpanDetailsProps = {
	span: TraceSpan | null;
	traceError?: unknown;
	traceResponse?: unknown;
};

function CodeSection({ title, code }: { title: string; code: string }) {
	return (
		<Stack gap={4} style={{ flex: 1, minHeight: 0 }}>
			<Text c="dimmed" fw={700} size="xs" style={{ flexShrink: 0 }}>
				{title}
			</Text>
			<ScrollArea
				style={{
					flex: 1,
					minHeight: 0,
					background: "var(--mantine-color-gray-0)",
					borderRadius: 4,
				}}
				type="auto"
			>
				<CodeHighlight
					code={code}
					language="typescript"
					withCopyButton={false}
				/>
			</ScrollArea>
		</Stack>
	);
}

export function SpanDetails({
	span,
	traceError,
	traceResponse,
}: SpanDetailsProps) {
	if (!span) {
		return (
			<Stack gap={6} style={{ minWidth: 0, height: "100%" }}>
				<Text c="dimmed" size="sm">
					Select a span
				</Text>
			</Stack>
		);
	}

	const resultValue =
		span.kind === "http" && span.result === undefined
			? traceResponse
			: span.result;
	const errorValue =
		span.kind === "http" && span.error === undefined ? traceError : span.error;

	const consoleCode =
		span.console.length > 0
			? span.console.map(formatConsoleCall).join("\n")
			: "// No console output";

	return (
		<Stack gap="xs" style={{ minWidth: 0, height: "100%" }}>
			<Text fw={700} size="sm" style={{ flexShrink: 0 }}>
				{formatSpanLabel(span, span.moduleName ?? null)}
			</Text>
			<CodeSection
				title="Call"
				code={formatMethodCall(span.methodName, getDisplayArgs(span))}
			/>
			<CodeSection
				title={span.status === "ok" ? "Result" : "Error"}
				code={
					span.status === "ok"
						? `return ${stringifyPretty(resultValue)}`
						: `throw ${stringifyPretty(errorValue)}`
				}
			/>
			<CodeSection
				title={`Console (${span.console.length})`}
				code={consoleCode}
			/>
		</Stack>
	);
}

function formatConsoleCall(entry: ConsoleEntry): string {
	const args = entry.args.map((arg) => stringifyPretty(arg)).join(", ");
	return `console.${entry.level}(${args})`;
}
