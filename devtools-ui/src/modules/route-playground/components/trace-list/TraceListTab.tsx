import { Box } from "@mantine/core";
import { useState } from "react";
import type { Trace } from "@/api/model";
import styles from "./styles.module.css";
import { SpanDetails } from "./SpanDetails";
import { SpanTree } from "./SpanTree";

type TraceListTabProps = {
	trace: Trace;
};

export function TraceListTab({ trace }: TraceListTabProps) {
	const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

	const selectedSpan =
		trace.spans.find((span) => span.id === selectedSpanId) ??
		trace.spans[0] ??
		null;

	return (
		<Box className={styles.traceGrid}>
			<Box className={styles.gridColumn}>
				<SpanTree
					onSelect={setSelectedSpanId}
					selectedSpanId={selectedSpan?.id ?? null}
					spans={trace.spans}
				/>
			</Box>

			<Box className={styles.gridColumn}>
				<SpanDetails
					span={selectedSpan}
					traceError={trace.error}
					traceResponse={trace.response}
				/>
			</Box>
		</Box>
	);
}
