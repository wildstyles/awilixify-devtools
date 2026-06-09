import styles from "./ModuleNode.module.css";

export function HighlightedText({
	query,
	text,
}: {
	query: string;
	text: string;
}) {
	const normalizedQuery = query.trim();

	if (!normalizedQuery) return text;

	const parts = splitByQuery(text, normalizedQuery);

	return (
		<>
			{parts.map((part, index) =>
				part.match ? (
					<mark
						className={styles.searchHighlight}
						key={`${part.text}-${index}`}
					>
						{part.text}
					</mark>
				) : (
					part.text
				),
			)}
		</>
	);
}

function splitByQuery(
	text: string,
	query: string,
): Array<{
	match: boolean;
	text: string;
}> {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const parts: Array<{ match: boolean; text: string }> = [];
	let cursor = 0;

	while (cursor < text.length) {
		const matchIndex = lowerText.indexOf(lowerQuery, cursor);

		if (matchIndex === -1) {
			parts.push({ match: false, text: text.slice(cursor) });
			break;
		}

		if (matchIndex > cursor) {
			parts.push({ match: false, text: text.slice(cursor, matchIndex) });
		}

		parts.push({
			match: true,
			text: text.slice(matchIndex, matchIndex + query.length),
		});
		cursor = matchIndex + query.length;
	}

	return parts;
}
