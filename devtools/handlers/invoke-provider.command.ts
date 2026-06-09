import type { CommandContract, Handler } from "awilixify";
import type { Deps } from "../devtools.module.js";
import type {
	InvokeProviderBody as Payload,
	InvokeProviderResponse as Response,
} from "../dtos/index.js";

type ProviderInstance = object | ((...args: unknown[]) => unknown);
type ConsoleEntry = Response["console"][number];

export class InvokeProviderCommandHandler
	implements Handler<InvokeProviderCommandHandler["contract"]>
{
	static readonly key = "devtools/invoke-provider";
	declare readonly contract: CommandContract<
		typeof InvokeProviderCommandHandler.key,
		Payload,
		Response
	>;

	constructor(private readonly graphCollector: Deps["graphCollector"]) {}

	async executor(payload: Payload): Promise<Response> {
		const consoleEntries: ConsoleEntry[] = [];
		const restoreConsole = this.captureConsole(consoleEntries);

		try {
			const provider = this.resolveProvider(
				payload.scopeModuleId,
				payload.providerKey,
			);

			const result = await this.resolveMethod(
				provider,
				payload.methodName,
			).apply(provider, payload.args);

			return {
				ok: true,
				result: this.toJsonSafeValue(result),
				console: consoleEntries,
			};
		} catch (error) {
			return {
				ok: false,
				error: this.serializeError(error),
				console: consoleEntries,
			};
		} finally {
			restoreConsole();
		}
	}

	private resolveProvider(
		scopeModuleId: string,
		providerKey: string,
	): ProviderInstance {
		const scope = this.graphCollector.getModuleScope(scopeModuleId);

		if (!scope) {
			throw new Error(`Module scope "${scopeModuleId}" was not found.`);
		}

		if (!scope.registrations[providerKey]) {
			throw new Error(
				`Provider "${providerKey}" is not available in module scope "${scopeModuleId}".`,
			);
		}

		const provider = scope.resolve(providerKey);

		if (
			provider === null ||
			(typeof provider !== "object" && typeof provider !== "function")
		) {
			throw new Error(
				`Provider "${providerKey}" in module scope "${scopeModuleId}" is not a class instance.`,
			);
		}

		return provider;
	}

	private resolveMethod(
		provider: unknown,
		methodName: string,
	): (...args: unknown[]) => unknown {
		if (!methodName) {
			throw new Error("Method name is required.");
		}

		if (
			provider === null ||
			(typeof provider !== "object" && typeof provider !== "function")
		) {
			throw new Error(`Cannot resolve method "${methodName}".`);
		}

		const value = (provider as Record<string, unknown>)[methodName];

		if (typeof value !== "function") {
			throw new Error(`"${methodName}" is not a function.`);
		}

		return value as (...args: unknown[]) => unknown;
	}

	private captureConsole(entries: ConsoleEntry[]): () => void {
		const original = {
			log: console.log,
			info: console.info,
			warn: console.warn,
			error: console.error,
		};

		const wrap =
			(level: ConsoleEntry["level"]) =>
			(...args: unknown[]) => {
				entries.push({
					level,
					args: args.map((arg) => this.toJsonSafeValue(arg)),
				});
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

	private serializeError(error: unknown): Response["error"] {
		if (error instanceof Error) {
			return {
				name: error.name,
				message: error.message,
				...(error.stack ? { stack: error.stack } : {}),
			};
		}

		return {
			name: "Error",
			message: String(error),
		};
	}

	private toJsonSafeValue(value: unknown): unknown {
		if (value === undefined) return undefined;

		const seen = new WeakSet<object>();
		const serialized = JSON.stringify(value, (_key, item) => {
			if (typeof item === "bigint") return item.toString();
			if (typeof item === "function") {
				return `[Function ${item.name || "anonymous"}]`;
			}
			if (typeof item === "symbol") return item.toString();
			if (item instanceof Error) return this.serializeError(item);
			if (item && typeof item === "object") {
				if (seen.has(item)) return "[Circular]";
				seen.add(item);
			}

			return item;
		});

		return serialized === undefined ? undefined : JSON.parse(serialized);
	}
}
