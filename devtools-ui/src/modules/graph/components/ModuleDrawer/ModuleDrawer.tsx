import { Drawer } from "@mantine/core";
import { useGraphSettings } from "../../GraphSettingsContext";
import type { ModuleNodeData } from "../../types";
import { ModuleInspector } from "./ModuleInspector";

type ModuleDrawerProps = {
	module: ModuleNodeData | null;
	loading: boolean;
};

export function ModuleDrawer({ module, loading }: ModuleDrawerProps) {
	const { setSelectedModuleId } = useGraphSettings();

	return (
		<Drawer
			opened={!loading && module !== null}
			onClose={() => setSelectedModuleId(null)}
			position="right"
			size={340}
			title={module?.name ?? "Module"}
			padding="md"
			trapFocus={false}
			closeOnEscape={false}
			closeOnClickOutside={false}
			withOverlay={false}
			overlayProps={{
				backgroundOpacity: 0,
				blur: 0,
			}}
		>
			<ModuleInspector module={module} />
		</Drawer>
	);
}
