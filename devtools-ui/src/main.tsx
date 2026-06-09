import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./modules/app/App";
import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";

import "@xyflow/react/dist/style.css";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
