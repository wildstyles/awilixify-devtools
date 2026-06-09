import type { ConsoleEntry, Trace, TraceSpan } from "../dtos/index.js";

export type ActiveTrace = {
	trace: Trace;
	currentSpanId: string | null;
	currentConsoleEntries: ConsoleEntry[];
	counter: {
		nextSpanId: number;
	};
	rootSpan: TraceSpan;
	finished: boolean;
	restoreConsole: () => void;
};
