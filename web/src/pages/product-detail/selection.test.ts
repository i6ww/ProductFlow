import { describe, expect, it } from "vitest";

import type { WorkflowNode } from "../../lib/types";
import {
  SELECTION_NODE_FALLBACK_HEIGHT,
  clearSelectedNodeGroup,
  deleteNodeFromSelection,
  focusSelectedNodeGroup,
  getIntersectingNodeIds,
  getNodeSelectionRect,
  reconcileSelectedNodeIds,
  replaceSelectedNodeIdsFromBox,
  toggleSelectedNodeId,
} from "./selection";

const node = (id: string, position_x: number, position_y: number): WorkflowNode => ({
  id,
  workflow_id: "workflow",
  node_type: "copy_generation",
  title: id,
  position_x,
  position_y,
  config_json: {},
  status: "idle",
  output_json: null,
  failure_reason: null,
  is_retryable: false,
  attempt_count: 0,
  retry_count: 0,
  non_retryable_reason: null,
  retry_hint: null,
  last_run_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("workflow canvas selection helpers", () => {
  it("uses measured card bounds when available and falls back to stable node dimensions", () => {
    expect(getNodeSelectionRect(node("a", 20, 30), { x: 40, y: 50 }, { width: 260, height: 220 })).toEqual({
      x: 40,
      y: 50,
      width: 260,
      height: 220,
    });
    expect(getNodeSelectionRect(node("a", 20, 30), { x: 40, y: 50 })).toEqual({
      x: 40,
      y: 50,
      width: 248,
      height: SELECTION_NODE_FALLBACK_HEIGHT,
    });
  });

  it("returns node ids whose card rectangles intersect the selection rectangle", () => {
    const nodes = [node("a", 20, 20), node("b", 340, 80), node("c", 700, 120)];
    expect(
      getIntersectingNodeIds(
        nodes,
        { x: 300, y: 60, width: 160, height: 160 },
        (item) => ({ x: item.position_x, y: item.position_y }),
        () => ({ width: 248, height: 190 }),
      ),
    ).toEqual(["b"]);
  });

  it("toggles ids while preserving selection order", () => {
    expect(toggleSelectedNodeId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSelectedNodeId(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("focuses a selected group member without collapsing the group", () => {
    expect(focusSelectedNodeGroup(["a", "b", "c"], "b")).toEqual({
      selectedNodeIds: ["a", "b", "c"],
      primaryNodeId: "b",
    });
    expect(focusSelectedNodeGroup(["a"], "b")).toEqual({
      selectedNodeIds: ["b"],
      primaryNodeId: "b",
    });
  });

  it("clears a selected group back to the primary node", () => {
    expect(clearSelectedNodeGroup("b")).toEqual(["b"]);
    expect(clearSelectedNodeGroup(null)).toEqual([]);
  });

  it("deleting a node exits multi-select and keeps a single primary node", () => {
    expect(deleteNodeFromSelection(["a", "b", "c"], "b", "b")).toEqual({
      selectedNodeIds: ["a"],
      primaryNodeId: "a",
    });
    expect(deleteNodeFromSelection(["a", "b", "c"], "c", "a")).toEqual({
      selectedNodeIds: ["a"],
      primaryNodeId: "a",
    });
    expect(deleteNodeFromSelection(["a"], "a", "a")).toEqual({
      selectedNodeIds: [],
      primaryNodeId: null,
    });
  });

  it("replaces selection from lasso results and falls back to the primary node for empty boxes", () => {
    expect(replaceSelectedNodeIdsFromBox(["b", "c"], "a")).toEqual({
      selectedNodeIds: ["b", "c"],
      primaryNodeId: "b",
    });
    expect(replaceSelectedNodeIdsFromBox([], "a")).toEqual({
      selectedNodeIds: ["a"],
      primaryNodeId: "a",
    });
    expect(replaceSelectedNodeIdsFromBox([], null)).toEqual({
      selectedNodeIds: [],
      primaryNodeId: null,
    });
  });

  it("reconciles deleted nodes and keeps the primary node selected", () => {
    expect(reconcileSelectedNodeIds(["a", "missing", "c"], [{ id: "a" }, { id: "b" }, { id: "c" }], "c")).toEqual({
      selectedNodeIds: ["a", "c"],
      primaryNodeId: "c",
    });
    expect(reconcileSelectedNodeIds(["missing"], [{ id: "a" }, { id: "b" }], "missing")).toEqual({
      selectedNodeIds: ["a"],
      primaryNodeId: "a",
    });
    expect(reconcileSelectedNodeIds(["b"], [{ id: "a" }, { id: "b" }], "a")).toEqual({
      selectedNodeIds: ["a", "b"],
      primaryNodeId: "a",
    });
  });
});
