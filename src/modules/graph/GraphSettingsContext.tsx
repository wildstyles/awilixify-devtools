import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GraphViewMode } from "../../graph/toFlowGraph";

type GraphSettings = {
  groupDynamicModules: boolean;
  hideInternalModules: boolean;
  impactOnly: boolean;
  searchInput: string;
  searchQuery: string;
  selectedModuleId: string | null;
  selectedModuleAvailable: boolean;
  setGroupDynamicModules: (checked: boolean) => void;
  setHideInternalModules: (checked: boolean) => void;
  setImpactOnly: (checked: boolean) => void;
  setSearchInput: (query: string) => void;
  setSelectedModuleId: (moduleId: string | null) => void;
  setSelectedModuleAvailable: (available: boolean) => void;
  setShowGlobalEdges: (checked: boolean) => void;
  setShowRelatedOnly: (checked: boolean) => void;
  setViewMode: (viewMode: GraphViewMode) => void;
  showGlobalEdges: boolean;
  showRelatedOnly: boolean;
  viewMode: GraphViewMode;
};

type PersistedGraphSettings = {
  groupDynamicModules: boolean;
  hideInternalModules: boolean;
  impactOnly: boolean;
  searchQuery: string;
  selectedModuleId: string;
  showGlobalEdges: boolean;
  showRelatedOnly: boolean;
  viewMode: GraphViewMode;
};

const defaultSettings: PersistedGraphSettings = {
  groupDynamicModules: false,
  hideInternalModules: true,
  impactOnly: false,
  searchQuery: "",
  selectedModuleId: "",
  showGlobalEdges: false,
  showRelatedOnly: false,
  viewMode: "dependencies" satisfies GraphViewMode,
};

const queryParamNames = {
  groupDynamicModules: "groupDynamic",
  hideInternalModules: "hideInternal",
  impactOnly: "impactOnly",
  searchQuery: "q",
  selectedModuleId: "selectedModule",
  showGlobalEdges: "globals",
  showRelatedOnly: "relatedOnly",
  viewMode: "view",
};

const GraphSettingsContext = createContext<GraphSettings | null>(null);

export function GraphSettingsProvider({ children }: { children: ReactNode }) {
  const initialSettings = useMemo(readSettingsFromUrl, []);
  const [groupDynamicModules, setGroupDynamicModules] = useState(
    initialSettings.groupDynamicModules,
  );
  const [hideInternalModules, setHideInternalModules] = useState(
    initialSettings.hideInternalModules,
  );
  const [impactOnly, setImpactOnly] = useState(initialSettings.impactOnly);
  const [searchInput, setSearchInput] = useState(initialSettings.searchQuery);
  const [searchQuery, setSearchQuery] = useState(initialSettings.searchQuery);
  const [selectedModuleId, setSelectedModuleIdState] = useState<string | null>(
    initialSettings.selectedModuleId || null,
  );
  const [selectedModuleAvailable, setSelectedModuleAvailable] = useState(false);
  const [showGlobalEdges, setShowGlobalEdges] = useState(
    initialSettings.showGlobalEdges,
  );
  const [showRelatedOnly, setShowRelatedOnly] = useState(
    initialSettings.showRelatedOnly,
  );
  const [viewMode, setViewMode] = useState<GraphViewMode>(
    initialSettings.viewMode,
  );
  const setSelectedModuleId = useCallback((moduleId: string | null) => {
    setSelectedModuleIdState(moduleId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    writeSettingsToUrl({
      groupDynamicModules,
      hideInternalModules,
      impactOnly,
      searchQuery,
      selectedModuleId: selectedModuleId ?? "",
      showGlobalEdges,
      showRelatedOnly,
      viewMode,
    });
  }, [
    groupDynamicModules,
    hideInternalModules,
    impactOnly,
    searchQuery,
    selectedModuleId,
    showGlobalEdges,
    showRelatedOnly,
    viewMode,
  ]);

  const value = useMemo<GraphSettings>(
    () => ({
      groupDynamicModules,
      hideInternalModules,
      impactOnly,
      searchInput,
      searchQuery,
      selectedModuleId,
      selectedModuleAvailable,
      setGroupDynamicModules,
      setHideInternalModules,
      setImpactOnly,
      setSearchInput,
      setSelectedModuleId,
      setSelectedModuleAvailable,
      setShowGlobalEdges,
      setShowRelatedOnly,
      setViewMode,
      showGlobalEdges,
      showRelatedOnly,
      viewMode,
    }),
    [
      groupDynamicModules,
      hideInternalModules,
      impactOnly,
      searchInput,
      searchQuery,
      selectedModuleId,
      selectedModuleAvailable,
      setSelectedModuleId,
      showGlobalEdges,
      showRelatedOnly,
      viewMode,
    ],
  );

  return (
    <GraphSettingsContext.Provider value={value}>
      {children}
    </GraphSettingsContext.Provider>
  );
}

export function useGraphSettings() {
  const context = useContext(GraphSettingsContext);
  if (!context) {
    throw new Error("useGraphSettings must be used within GraphSettingsProvider");
  }

  return context;
}

function readSettingsFromUrl(): PersistedGraphSettings {
  if (typeof window === "undefined") return defaultSettings;

  const params = new URLSearchParams(window.location.search);
  const viewMode = params.get(queryParamNames.viewMode);

  return {
    groupDynamicModules: readBooleanParam(
      params,
      queryParamNames.groupDynamicModules,
      defaultSettings.groupDynamicModules,
    ),
    hideInternalModules: readBooleanParam(
      params,
      queryParamNames.hideInternalModules,
      defaultSettings.hideInternalModules,
    ),
    impactOnly: readBooleanParam(
      params,
      queryParamNames.impactOnly,
      defaultSettings.impactOnly,
    ),
    searchQuery: params.get(queryParamNames.searchQuery) ?? "",
    selectedModuleId:
      params.get(queryParamNames.selectedModuleId) ??
      defaultSettings.selectedModuleId,
    showGlobalEdges: readBooleanParam(
      params,
      queryParamNames.showGlobalEdges,
      defaultSettings.showGlobalEdges,
    ),
    showRelatedOnly: readBooleanParam(
      params,
      queryParamNames.showRelatedOnly,
      defaultSettings.showRelatedOnly,
    ),
    viewMode: isGraphViewMode(viewMode) ? viewMode : defaultSettings.viewMode,
  };
}

function writeSettingsToUrl(settings: PersistedGraphSettings) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  writeBooleanParam(
    url.searchParams,
    queryParamNames.groupDynamicModules,
    settings.groupDynamicModules,
    defaultSettings.groupDynamicModules,
  );
  writeBooleanParam(
    url.searchParams,
    queryParamNames.hideInternalModules,
    settings.hideInternalModules,
    defaultSettings.hideInternalModules,
  );
  writeBooleanParam(
    url.searchParams,
    queryParamNames.impactOnly,
    settings.impactOnly,
    defaultSettings.impactOnly,
  );
  writeStringParam(
    url.searchParams,
    queryParamNames.searchQuery,
    settings.searchQuery,
    defaultSettings.searchQuery,
  );
  writeStringParam(
    url.searchParams,
    queryParamNames.selectedModuleId,
    settings.selectedModuleId,
    defaultSettings.selectedModuleId,
  );
  writeBooleanParam(
    url.searchParams,
    queryParamNames.showGlobalEdges,
    settings.showGlobalEdges,
    defaultSettings.showGlobalEdges,
  );
  writeBooleanParam(
    url.searchParams,
    queryParamNames.showRelatedOnly,
    settings.showRelatedOnly,
    defaultSettings.showRelatedOnly,
  );
  writeStringParam(
    url.searchParams,
    queryParamNames.viewMode,
    settings.viewMode,
    defaultSettings.viewMode,
  );

  window.history.replaceState(window.history.state, "", url);
}

function readBooleanParam(
  params: URLSearchParams,
  name: string,
  fallback: boolean,
) {
  const value = params.get(name);
  if (value === null) return fallback;

  return value === "1" || value === "true";
}

function writeBooleanParam(
  params: URLSearchParams,
  name: string,
  value: boolean,
  defaultValue: boolean,
) {
  if (value === defaultValue) {
    params.delete(name);
  } else {
    params.set(name, value ? "1" : "0");
  }
}

function writeStringParam(
  params: URLSearchParams,
  name: string,
  value: string,
  defaultValue: string,
) {
  const normalizedValue = value.trim();

  if (normalizedValue === defaultValue) {
    params.delete(name);
  } else {
    params.set(name, normalizedValue);
  }
}

function isGraphViewMode(value: string | null): value is GraphViewMode {
  return value === "dependencies" || value === "providers";
}
