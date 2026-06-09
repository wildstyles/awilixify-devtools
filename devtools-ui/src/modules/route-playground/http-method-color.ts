export function getMethodColor(method: string): string {
	switch (method) {
		case "GET":
			return "blue";
		case "POST":
			return "green";
		case "PUT":
			return "orange";
		case "PATCH":
			return "yellow";
		case "DELETE":
			return "red";
		default:
			return "gray";
	}
}
