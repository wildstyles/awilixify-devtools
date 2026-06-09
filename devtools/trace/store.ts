import { AsyncLocalStorage } from "node:async_hooks";
import type {
	RecordSpanInput,
	RunInControllerTraceInput,
} from "awilixify/devtools";
import { isPromiseLike } from "awilixify/devtools";
import type { ConsoleEntry, Trace, TraceSpan } from "../dtos/index.js";
import { ResponseSanitizer } from "./response-sanitizer.js";
import type { ActiveTrace } from "./types.js";

const MAX_TRACES = 5;

export class DevtoolsTraceStore {
	private readonly storage = new AsyncLocalStorage<ActiveTrace>();
	private readonly responseSanitizer = new ResponseSanitizer();
	private readonly traces: Trace[] = [];
	private nextTraceId = 1;

	getTraces(): Trace[] {
		return [...this.traces];
	}

	getTrace(traceId: string): Trace | null {
		return this.traces.find((trace) => trace.id === traceId) ?? null;
	}

	recordSpan<T>(input: RecordSpanInput<T>): T | Promise<T> {
		const activeTrace = this.storage.getStore();

		if (!activeTrace) return input.callback();

		const consoleEntries: ConsoleEntry[] = [];
		const span: TraceSpan = {
			id: `${activeTrace.trace.id}:span-${activeTrace.counter.nextSpanId++}`,
			parentId: activeTrace.currentSpanId,
			kind: input.kind,
			label: [input.moduleName, input.providerKey, input.methodName].join("."),
			moduleId: input.moduleId ?? null,
			moduleName: input.moduleName,
			providerKey: input.providerKey,
			methodName: input.methodName,
			args: this.responseSanitizer.sanitize(input.args) as unknown[],
			result: null,
			error: null,
			startedAt: Date.now(),
			durationMs: 0,
			status: "ok",
			console: consoleEntries,
		};

		activeTrace.trace.spans.push(span);

		const finish = () => {
			span.durationMs = Date.now() - span.startedAt;

			// For interceptors, show self-time (exclude proceed duration)
			if (input.getProceedDurationMs) {
				span.durationMs = Math.max(
					0,
					span.durationMs - input.getProceedDurationMs(),
				);
			}
		};

		return this.storage.run(
			{
				...activeTrace,
				currentSpanId: span.id,
				currentConsoleEntries: consoleEntries,
			},
			() => {
				try {
					const result = input.callback();

					if (isPromiseLike(result)) {
						return result
							.then(
								(value) => {
									span.result = this.responseSanitizer.sanitize(value);
									return value;
								},
								(error) => {
									span.status = "error";
									span.error = this.responseSanitizer.toTraceError(error);
									throw error;
								},
							)
							.finally(finish);
					}

					span.result = this.responseSanitizer.sanitize(result);
					finish();
					return result;
				} catch (error) {
					span.status = "error";
					span.error = this.responseSanitizer.toTraceError(error);
					finish();

					throw error;
				}
			},
		);
	}

	runInCurrentSpan<T>(callback: () => T | Promise<T>): T | Promise<T> {
		const activeTrace = this.storage.getStore();

		if (!activeTrace) return callback();

		const currentSpan = activeTrace.trace.spans.find(
			(span) => span.id === activeTrace.currentSpanId,
		);

		if (!currentSpan) return callback();

		return this.storage.run(
			{
				...activeTrace,
				currentConsoleEntries: currentSpan.console,
			},
			callback,
		);
	}

	/**
	 * Starts a controller trace context without recording a span.
	 * Used to wrap around interceptors so they can record spans before the controller span.
	 */
	runInControllerTrace<T>(input: RunInControllerTraceInput<T>): T | Promise<T> {
		// If already in a trace, just run the callback
		if (this.storage.getStore()) {
			return input.callback();
		}

		// Skip tracing devtools routes
		const requestInfo = this.responseSanitizer.getRequestInfo(input.args);
		if (requestInfo.path?.startsWith("/__devtools")) {
			return input.callback();
		}

		const activeTrace = this.createTraceContext(input);

		return this.storage.run(activeTrace, () => {
			try {
				const result = input.callback();

				if (isPromiseLike(result)) {
					return result.then(
						(value) => {
							this.finishTrace({ response: value, args: input.args });
							return value;
						},
						(error) => {
							this.finishTrace({ error, args: input.args });
							throw error;
						},
					);
				}

				this.finishTrace({ response: result, args: input.args });
				return result;
			} catch (error) {
				this.finishTrace({ error, args: input.args });
				throw error;
			}
		});
	}

	private createTraceContext(
		input: RunInControllerTraceInput<unknown>,
	): ActiveTrace {
		const requestInfo = this.responseSanitizer.getRequestInfo(input.args);
		const label = `${input.moduleName}.${input.providerKey}.${input.methodName}`;
		const rootConsoleEntries: ConsoleEntry[] = [];
		const trace: Trace = {
			id: `trace-${this.nextTraceId++}`,
			method: requestInfo.method,
			path: requestInfo.path ?? label,
			url: requestInfo.url ?? label,
			request: requestInfo.request ?? {
				args: this.responseSanitizer.sanitize(input.args),
			},
			response: null,
			error: null,
			statusCode: null,
			startedAt: Date.now(),
			durationMs: 0,
			status: "ok",
			spans: [],
			console: [],
		};
		const counter = {
			nextSpanId: 1,
		};
		// Internal root span for tracking timing/errors - not added to visible spans.
		const rootSpan: TraceSpan = {
			id: `${trace.id}:span-0`,
			parentId: null,
			kind: "controller",
			label:
				requestInfo.method === "INVOKE"
					? label
					: `${requestInfo.method} ${trace.path}`,
			moduleId: null,
			moduleName: input.moduleName,
			providerKey: input.providerKey,
			methodName: input.methodName,
			args: this.responseSanitizer.sanitize(input.args) as unknown[],
			result: null,
			error: null,
			startedAt: Date.now(),
			durationMs: 0,
			status: "ok",
			console: rootConsoleEntries,
		};

		return {
			trace,
			currentSpanId: null, // No current span - all root-level spans get parentId: null
			currentConsoleEntries: rootConsoleEntries,
			counter,
			rootSpan,
			finished: false,
			restoreConsole: this.setupConsoleCapture(),
		};
	}

	private finishTrace(options: {
		error?: unknown;
		response?: unknown;
		args?: unknown[];
	}): void {
		const activeTrace = this.storage.getStore();

		if (!activeTrace || activeTrace.finished) return;

		const { rootSpan, trace } = activeTrace;

		activeTrace.finished = true;
		activeTrace.restoreConsole();
		rootSpan.durationMs = Date.now() - rootSpan.startedAt;
		trace.durationMs = rootSpan.durationMs;

		trace.statusCode = this.extractStatusCode(options.args, options.response);
		trace.response = this.responseSanitizer.sanitize(options.response);

		if (options.error !== undefined) {
			const traceError = this.responseSanitizer.toTraceError(options.error);
			rootSpan.status = "error";
			rootSpan.error = traceError;
			trace.status = "error";
			trace.error = traceError;
		}

		this.traces.unshift(trace);
		this.traces.splice(MAX_TRACES);
	}

	private extractStatusCode(
		args?: unknown[],
		response?: unknown,
	): number | null {
		// Try to get status code from response object (e.g., Fastify reply)
		if (args && args[1] && typeof args[1] === "object") {
			const reply = args[1] as { statusCode?: unknown };
			if (typeof reply.statusCode === "number") {
				return reply.statusCode;
			}
		}

		// Try to get from response if it has statusCode
		if (response && typeof response === "object") {
			const resp = response as { statusCode?: unknown };
			if (typeof resp.statusCode === "number") {
				return resp.statusCode;
			}
		}

		return null;
	}

	private setupConsoleCapture(): () => void {
		const original = {
			log: console.log,
			info: console.info,
			warn: console.warn,
			error: console.error,
		};

		const wrap =
			(level: ConsoleEntry["level"]) =>
			(...args: unknown[]) => {
				const activeTrace = this.storage.getStore();
				if (activeTrace) {
					activeTrace.currentConsoleEntries.push({
						level,
						args: args.map((arg) => this.responseSanitizer.sanitize(arg)),
					});
				}
				original[level](...args);
			};

		console.log = wrap("log");
		console.info = wrap("info");
		console.warn = wrap("warn");
		console.error = wrap("error");

		return () => {
			console.log = original.log;
			console.info = original.info;
			console.warn = original.warn;
			console.error = original.error;
		};
	}
}
