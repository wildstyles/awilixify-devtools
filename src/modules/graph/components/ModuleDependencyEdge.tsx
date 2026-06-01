import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { ModuleFlowEdge } from "../../../graph/toFlowGraph";

export function ModuleDependencyEdge({
  data,
  markerEnd,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps<ModuleFlowEdge>) {
  const [fallbackPath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      path={data?.path ?? fallbackPath}
      markerEnd={markerEnd}
      style={data?.color ? { stroke: data.color } : undefined}
    />
  );
}
