"use client";

/**
 * Hermes Event Stream Panel
 *
 * Displays the causal event stream with tier-based coloring,
 * frontier indicators, and depth visualization.
 * This is a STRICT PROJECTION — read-only view of the event log.
 */

import React from "react";
import { useHermesStore, type EventStreamItem } from "@/store/hermes-store";

const tierColors: Record<string, string> = {
  MODEL: "#ffd60a",
  DECISION: "#00d1ff",
  EXECUTION: "#22c55e",
  SYSTEM: "#8a94a3",
  TELEMETRY: "#f59e0b",
};

const tierIcons: Record<string, string> = {
  MODEL: "🧠",
  DECISION: "→",
  EXECUTION: "⚡",
  SYSTEM: "⚙",
  TELEMETRY: "📊",
};

function EventCard({ event, isSelected, onClick }: {
  event: EventStreamItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = tierColors[event.tier] ?? "#8a94a3";
  const icon = tierIcons[event.tier] ?? "●";

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? "#1a2332" : "#0f141b",
        border: `2px solid ${isSelected ? color : "#2a3441"}`,
        boxShadow: isSelected ? `2px 2px 0 ${color}` : "2px 2px 0 #000",
        padding: "8px 10px",
        cursor: "pointer",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        position: "relative",
      }}
    >
      {/* Left bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: color,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>{icon}</span>
          <span style={{ color, fontWeight: 700, fontSize: "9px", textTransform: "uppercase" }}>
            {event.tier}
          </span>
          <span style={{ color: "#5a6577", fontSize: "9px" }}>d{event.depth}</span>
          {event.isFrontier && (
            <span
              style={{
                background: "#ffd60a",
                color: "#000",
                padding: "0 4px",
                fontSize: "8px",
                fontWeight: 700,
              }}
            >
              FRONTIER
            </span>
          )}
        </div>
        <span style={{ color: "#5a6577", fontSize: "9px" }}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div style={{ color: "#e8eaed", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {event.label}
      </div>

      {event.summary && (
        <div
          style={{
            color: "#8a94a3",
            fontSize: "10px",
            marginTop: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {event.summary}
        </div>
      )}

      {event.agentName && (
        <div style={{ color: "#5a6577", fontSize: "9px", marginTop: "2px" }}>
          agent: {event.agentName}
        </div>
      )}
    </div>
  );
}

export function HermesEventStream() {
  const eventStream = useHermesStore((s) => s.eventStream);
  const selectedEventId = useHermesStore((s) => s.selectedEventId);
  const setSelectedEvent = useHermesStore((s) => s.setSelectedEvent);

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
        <span style={{ color: "#ffd60a", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Causal Event Stream
        </span>
        <span style={{ color: "#5a6577", fontSize: "10px" }}>
          {eventStream.length} events
        </span>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px" }}>
        {eventStream.length === 0 ? (
          <div style={{ padding: "16px", color: "#5a6577", textAlign: "center", fontSize: "11px" }}>
            No events yet. Start a Hermes run to see the causal stream.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {eventStream.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isSelected={event.id === selectedEventId}
                onClick={() => setSelectedEvent(event.id === selectedEventId ? null : event.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
