export type ModuleGraph = {
  rootModuleId: string | null;
  modules: ModuleGraphNode[];
  edges: ModuleGraphEdge[];
};

export type ModuleGraphNode = {
  id: string;
  name: string;
  baseName?: string;
  dynamic?: {
    hash: string;
    paramsPreview: string;
  };
  kind: "root" | "global" | "feature" | "internal";
  providers: string[];
  providerAllowCircular?: Record<string, boolean>;
  providerDependencies?: Record<string, string[]>;
  providerEager?: Record<string, boolean>;
  providerInitAfter?: Record<string, string[]>;
  providerLifetimes?: Record<string, ProviderLifetime>;
  exports: string[];
  controllers: string[];
  queryHandlers: string[];
  commandHandlers: string[];
  queryPreHandlers: string[];
  commandPreHandlers: string[];
  interceptors: string[];
  initializers: string[];
};

export type ProviderLifetime = "SCOPED" | "SINGLETON" | "TRANSIENT";

export type ModuleGraphEdge = {
  from: string;
  to: string;
  type: "imports" | "global";
};

export type ProviderImpact = {
  changedFiles: string[];
  changedProviders: ProviderImpactItem[];
  deletedFiles: string[];
  deletedProviders: ProviderImpactItem[];
  newFiles: string[];
  newProviders: ProviderImpactItem[];
  affectedProviders: ProviderImpactItem[];
};

export type ProviderImpactItem = {
  moduleId: string;
  moduleName: string;
  provider: string;
};
