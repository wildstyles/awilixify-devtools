import clsx from "clsx";
import type { ProviderImpactStatus } from "@/api/model";
import styles from "./ModuleNode.module.css";

export function ProviderStatusDot({
	added,
	affected,
	changed,
	deleted,
	status,
}: {
	added?: boolean;
	affected?: boolean;
	changed?: boolean;
	deleted?: boolean;
	status?: ProviderImpactStatus;
}) {
	const resolvedStatus =
		status ??
		(deleted
			? "deleted"
			: added
				? "new"
				: changed
					? "changed"
					: affected
						? "affected"
						: null);

	if (!resolvedStatus) return null;

	return (
		<span
			className={clsx(styles.providerStatusDot, styles[resolvedStatus])}
		/>
	);
}
