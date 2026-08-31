"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ConceptGraph, GraphNode } from "@/lib/graph";

// A dependency-free SVG node-link diagram. Layout is deterministic (goals on an
// inner ring, tags on an outer ring) rather than force-directed, so it renders
// identically server- and client-side and stays cheap to draw on every visit.
const WIDTH = 800;
const HEIGHT = 600;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const TAG_RADIUS_X = 320;
const TAG_RADIUS_Y = 250;
const GOAL_RADIUS_X = 130;
const GOAL_RADIUS_Y = 100;

type Point = { x: number; y: number };

function ringPositions(
  count: number,
  radiusX: number,
  radiusY: number,
): Point[] {
  if (count === 0) return [];
  if (count === 1) return [{ x: CX, y: CY }];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      x: CX + radiusX * Math.cos(angle),
      y: CY + radiusY * Math.sin(angle),
    };
  });
}

function nodeHref(node: GraphNode): string {
  return node.kind === "tag"
    ? `/tags/${encodeURIComponent(node.label)}`
    : `/goals/${node.goalId}`;
}

export function ConceptGraphView({ graph }: { graph: ConceptGraph }) {
  const positions = useMemo(() => {
    const tags = graph.nodes.filter((n) => n.kind === "tag");
    const goals = graph.nodes.filter((n) => n.kind === "goal");
    const map = new Map<string, Point>();

    ringPositions(tags.length, TAG_RADIUS_X, TAG_RADIUS_Y).forEach((p, i) =>
      map.set(tags[i].id, p),
    );
    ringPositions(goals.length, GOAL_RADIUS_X, GOAL_RADIUS_Y).forEach((p, i) =>
      map.set(goals[i].id, p),
    );

    return map;
  }, [graph.nodes]);

  if (graph.nodes.length === 0) {
    return (
      <div className="empty-state">
        No concepts to map yet. Tag some notes and their connections will appear
        here.
      </div>
    );
  }

  return (
    <svg
      className="concept-graph"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Concept graph of tags and goals"
    >
      <g>
        {graph.edges.map((edge, i) => {
          const from = positions.get(edge.source);
          const to = positions.get(edge.target);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.source}-${edge.target}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={`graph-edge graph-edge-${edge.kind}`}
              stroke={edge.kind === "goal-tag" ? "#c7b8f0" : "#cfcfcf"}
              strokeWidth={1}
            />
          );
        })}
      </g>
      <g>
        {graph.nodes.map((node) => {
          const p = positions.get(node.id);
          if (!p) return null;
          const isGoal = node.kind === "goal";
          return (
            <Link key={node.id} href={nodeHref(node)}>
              <g className={`graph-node graph-node-${node.kind}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isGoal ? 10 : 6}
                  fill={isGoal ? "#7c5cd6" : "#4a90d9"}
                />
                <text
                  x={p.x}
                  y={p.y - (isGoal ? 16 : 12)}
                  textAnchor="middle"
                  className="graph-node-label"
                  fontSize={isGoal ? 14 : 12}
                >
                  {node.label}
                </text>
              </g>
            </Link>
          );
        })}
      </g>
    </svg>
  );
}
