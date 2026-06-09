import type { Trace } from "@/api/model";

export function compactTrace(trace: Trace) {
	return {
		id: trace.id,
		method: trace.method,
		path: trace.path,
		url: trace.url,
		request: omitUndefined({
			body: compactValue(trace.request.body),
			headers: compactHeaders(trace.request.headers),
			params: compactValue(trace.request.params),
			query: compactValue(trace.request.query),
		}),
		startedAt: trace.startedAt,
		durationMs: trace.durationMs,
		status: trace.status,
		statusCode: trace.statusCode,
		response: compactValue(trace.response),
		error: trace.error,
		spans: trace.spans.map((span) =>
			omitUndefined({
				id: span.id,
				parentId: span.parentId,
				kind: span.kind,
				label: span.label,
				moduleId: span.moduleId,
				moduleName: span.moduleName,
				providerKey: span.providerKey,
				methodName: span.methodName,
				args: compactValue(span.args),
				result: compactValue(span.result),
				error: span.error,
				startedAt: span.startedAt,
				durationMs: span.durationMs,
				status: span.status,
			}),
		),
	};
}

function compactHeaders(headers: unknown) {
	if (!headers || typeof headers !== "object") return undefined;

	const source = headers as Record<string, unknown>;
	const allowedHeaders = [
		"accept",
		"authorization",
		"content-type",
		"origin",
		"x-request-id",
	];
	const compacted: Record<string, unknown> = {};

	for (const header of allowedHeaders) {
		const value = source[header];
		if (value === undefined) continue;
		compacted[header] = header === "authorization" ? maskHeader(value) : value;
	}

	return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function maskHeader(value: unknown) {
	if (typeof value !== "string") return "[redacted]";
	if (value.length <= 12) return "[redacted]";

	return `${value.slice(0, 8)}...[redacted]`;
}

function compactValue(value: unknown, depth = 0): unknown {
	if (value === null || value === undefined) return value;
	if (typeof value !== "object") return value;
	if (depth >= 6) return "[Object]";
	if (Array.isArray(value)) {
		return value.map((item) => compactValue(item, depth + 1));
	}

	const compacted: Record<string, unknown> = {};
	const source = value as Record<string, unknown>;

	for (const [key, childValue] of Object.entries(source)) {
		if (shouldDropCompactKey(key)) continue;

		compacted[key] = compactValue(childValue, depth + 1);
	}

	return compacted;
}

function shouldDropCompactKey(key: string) {
	return (
		key.startsWith("_") ||
		[
			"client",
			"log",
			"raw",
			"reply",
			"req",
			"request",
			"res",
			"socket",
		].includes(key)
	);
}

function omitUndefined<T extends Record<string, unknown>>(value: T) {
	return Object.fromEntries(
		Object.entries(value).filter(([, entry]) => entry !== undefined),
	);
}
