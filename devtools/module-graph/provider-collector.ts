import type { Constructor, LifetimeType } from "awilix";
import {
	hasInitAfter,
	hasUseClass,
	isCostructorProvider,
	isEagerProvider,
	type InternalModuleLike as M,
} from "awilixify/devtools";
import type { ModuleGraphNode } from "./types.js";

type ModuleGraphProviderMetadata = Pick<
	ModuleGraphNode,
	| "lifetimeTypes"
	| "providerAllowCircular"
	| "providerDependencies"
	| "providerEager"
	| "providerInitAfter"
	| "providers"
>;

export class ModuleGraphProviderCollector {
	collectProviders(module: M): ModuleGraphProviderMetadata {
		const providers = module.providers ?? {};

		return {
			providers: Object.keys(providers),
			providerAllowCircular: this.getProviderAllowCircular(providers),
			providerDependencies: this.getProviderDependencies(providers),
			providerEager: this.getProviderEager(providers),
			providerInitAfter: this.getProviderInitAfter(providers),
			lifetimeTypes: this.getLifetimeTypes(
				providers,
				module.providerOptions?.lifetime,
			),
		};
	}

	private getProviderAllowCircular(
		providers: NonNullable<M["providers"]>,
	): Record<string, boolean> {
		return Object.fromEntries(
			Object.entries(providers).map(([providerName, provider]) => [
				providerName,
				(provider as { allowCircular?: boolean })?.allowCircular === true,
			]),
		);
	}

	private getProviderEager(
		providers: NonNullable<M["providers"]>,
	): Record<string, boolean> {
		return Object.fromEntries(
			Object.entries(providers).map(([providerName, provider]) => [
				providerName,
				isEagerProvider(provider),
			]),
		);
	}

	private getProviderInitAfter(
		providers: NonNullable<M["providers"]>,
	): Record<string, string[]> {
		return Object.fromEntries(
			Object.entries(providers).map(([providerName, provider]) => [
				providerName,
				hasInitAfter(provider) ? [...provider.initAfter] : [],
			]),
		);
	}

	private getLifetimeTypes(
		providers: NonNullable<M["providers"]>,
		moduleLifetime?: LifetimeType,
	): Record<string, LifetimeType> {
		return Object.fromEntries(
			Object.entries(providers).map(([providerName, provider]) => [
				providerName,
				(provider as { lifetime?: LifetimeType })?.lifetime ??
					moduleLifetime ??
					"SINGLETON",
			]),
		);
	}

	private getProviderDependencies(
		providers: NonNullable<M["providers"]>,
	): Record<string, string[]> {
		return Object.fromEntries(
			Object.entries(providers).map(([providerName, provider]) => [
				providerName,
				this.getProviderDependencyNames(provider),
			]),
		);
	}

	private getProviderDependencyNames(provider: unknown): string[] {
		const inject = (provider as { inject?: unknown })?.inject;

		if (Array.isArray(inject)) return inject;

		const useClass = isCostructorProvider(provider)
			? provider
			: hasUseClass(provider)
				? provider.useClass
				: null;

		return useClass ? this.getConstructorParamNames(useClass) : [];
	}

	private getConstructorParamNames(useClass: Constructor<object>): string[] {
		// Use the intrinsic function source, not a possibly overridden toString().
		const source = Function.prototype.toString.call(useClass);
		const match = source.match(/constructor\s*\(([^)]*)\)/);
		const params = match?.[1];

		if (!params) return [];

		return this.splitParams(params).flatMap((param) => {
			const name = this.getParamName(param);

			return name ? [name] : [];
		});
	}

	private splitParams(params: string): string[] {
		const result: string[] = [];
		let depth = 0;
		let current = "";

		for (const char of params) {
			if (char === "," && depth === 0) {
				result.push(current);
				current = "";
				continue;
			}

			// Ignore commas inside destructuring, tuple/object types, or defaults.
			if ("([{<".includes(char)) depth += 1;
			if (")]}>".includes(char)) depth = Math.max(0, depth - 1);
			current += char;
		}

		if (current.trim()) result.push(current);

		return result;
	}

	private getParamName(param: string): string | null {
		// Strip TS parameter syntax down to the runtime identifier name.
		const signatureName = param
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.replace(/\/\/.*$/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.replace(/^(public|private|protected|readonly|override)\s+/g, "")
			.replace(/^(public|private|protected|readonly|override)\s+/g, "")
			.replace(/^\.\.\./, "")
			.split("=")[0]
			?.split(":")[0]
			?.trim();

		if (!signatureName || /^[{[]/.test(signatureName)) return null;

		return signatureName.match(/^[A-Za-z_$][\w$]*/)?.[0] ?? null;
	}
}
