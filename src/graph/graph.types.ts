export type AwilixifyGraph = {
  source: string;
  modules: AwilixifyGraphModule[];
  edges: AwilixifyGraphEdge[];
};

export type AwilixifyGraphModule = {
  id: string;
  name: string;
  providers: string[];
};

export type AwilixifyGraphEdge = {
  from: string;
  to: string;
  type: "imports" | "depends-on";
};
