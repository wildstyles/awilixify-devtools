import type { ProviderImpact } from "../../graph/graph.types";

export const emptyImpact: ProviderImpact = {
  affectedProviders: [],
  changedFiles: [],
  changedProviders: [],
  deletedFiles: [],
  deletedProviders: [],
  newFiles: [],
  newProviders: [],
};
