import clsx from "clsx";
import type { LifetimeType } from "@/api/model";
import styles from "./ModuleNode.module.css";

export function AllowCircularIcon() {
	return (
		<span
			aria-label="Allows circular dependency"
			className={styles.allowCircularIcon}
			role="img"
			title="Allows circular dependency"
		/>
	);
}

export function EagerProviderIcon() {
	return (
		<span
			aria-label="Eager provider"
			className={styles.providerEagerIcon}
			role="img"
			title="Eager provider"
		>
			E
		</span>
	);
}

export function LifetimeTypeIcon({ lifetime }: { lifetime?: LifetimeType }) {
	if (lifetime !== "SCOPED" && lifetime !== "TRANSIENT") return null;

	return (
		<span
			aria-label={`${lifetime.toLowerCase()} provider`}
			className={clsx(styles.lifetimeTypeIcon, {
				[styles.scoped]: lifetime === "SCOPED",
				[styles.transient]: lifetime === "TRANSIENT",
			})}
			role="img"
			title={`${lifetime.toLowerCase()} provider`}
		>
			{lifetime === "SCOPED" ? "S" : "T"}
		</span>
	);
}
