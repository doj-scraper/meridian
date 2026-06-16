"use client";

/**
 * Hermes Frontier Panel
 *
 * Displays the causal frontier state — which events are currently
 * executable, which have been visited, and active branches.
 * This is a STRICT PROJECTION of the frontier solver output.
 */

import React from "react";
import { useHermesStore } from "@/store/hermes-store";

export function HermesFrontierPanel() {
  const frontier = useHermesStore((s) => s.frontier);
  const eventStream = useHermesStore((s) => s.eventStream);
  const runStatus = useHermesStore((s) => s.runStatus);

  const frontierEvents = eventStream.filter(
    (e) => frontier?.frontierNodeIds.includes(e.id)
  );
  const visitedCount = frontier?.visitedNodeIds.length ?? 0;
  const frontierSize = frontier?.size ?? 0;

  return (
    <div
      style={{
        height: "100%",
        background: "#05070a",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "2px solid #000",
          background: "#0f141b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#00d1ff", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Causal Frontier
        </span>
        <span
          style={{
            background: runStatus === "running" ? "#ffd60a" : "#2a3441",
            color: runStatus === "running" ? "#000" : "#8a94a3",
            padding: "1px 6px",
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {runStatus}
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "4px",
          padding: "8px",
        }}
      >
        <div
          style={{
            background: "#0f141b",
            border: "2px solid #2a3441",
            boxShadow: "2px 2px 0 #000",
            padding: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#ffd60a", fontSize: "18px", fontWeight: 700 }}>{frontierSize}</div>
          <div style={{ color: "#5a6577", fontSize: "9px", textTransform: "uppercase" }}>Frontier</div>
        </div>
        <div
          style={{
            background: "#0f141b",
            border: "2px solid #2a3441",
            boxShadow: "2px 2px 0 #000",
            padding: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#22c55e", fontSize: "18px", fontWeight: 700 }}>{visitedCount}</div>
          <div style={{ color: "#5a6577", fontSize: "9px", textTransform: "uppercase" }}>Visited</div>
        </div>
        <div
          style={{
            background: "#0f141b",
            border: "2px solid #2a3441",
            boxShadow: "2px 2px 0 #000",
            padding: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#00d1ff", fontSize: "18px", fontWeight: 700 }}>
            {frontier?.activeBranches.length ?? 0}
          </div>
          <div style={{ color: "#5a6577", fontSize: "9px", textTransform: "uppercase" }}>Branches</div>
        </div>
      </div>

      {/* Frontier Events */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        <div style={{ color: "#8a94a3", fontSize: "10px", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>
          Executable Next ({frontierEvents.length})
        </div>

        {frontierEvents.length === 0 ? (
          <div
            style={{
              padding: "12px",
              background: "#0f141b",
              border: "2px solid #2a3441",
              boxShadow: "2px 2px 0 #000",
              color: "#5a6577",
              fontSize: "10px",
              textAlign: "center",
            }}
          >
            {frontier?.isExhausted
              ? "Frontier exhausted — all events visited"
              : "No frontier events available"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {frontierEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  background: "#0f141b",
                  border: "2px solid #ffd60a",
                  boxShadow: "2px 2px 0 #ffd60a40",
                  padding: "6px 8px",
                  fontSize: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#ffd60a", fontWeight: 700 }}>{event.label}</span>
                  <span style={{ color: "#5a6577" }}>d{event.depth}</span>
                </div>
                {event.agentName && (
                  <div style={{ color: "#8a94a3", marginTop: "2px" }}>
                    {event.agentName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Branches */}
      {frontier && frontier.activeBranches.length > 0 && (
        <div style={{ padding: "4px 8px 8px", borderTop: "2px solid #000" }}>
          <div style={{ color: "#8a94a3", fontSize: "10px", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase" }}>
            Active Branches
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {frontier.activeBranches.map((branch) => (
              <span
                key={branch}
                style={{
                  background: "#00d1ff20",
                  color: "#00d1ff",
                  border: "1px solid #00d1ff",
                  padding: "1px 6px",
                  fontSize: "9px",
                  fontWeight: 600,
                }}
              >
                {branch}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
