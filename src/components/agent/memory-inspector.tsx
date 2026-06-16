"use client";

import { useEffect, useState } from "react";
import { useAgentStore } from "@/store/agent-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Brain,
  HardDrive,
  FileText,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";

type MemoryEntry = {
  key: string;
  value: string;
  tier: "session" | "persistent";
  createdAt?: string;
  expiresAt?: string;
};

type ArtifactEntry = {
  id: string;
  name: string;
  type: string;
  preview?: string;
  createdAt: string;
};

export function MemoryInspector({ agentId }: { agentId: string }) {
  const [sessionEntries, setSessionEntries] = useState<MemoryEntry[]>([]);
  const [persistentEntries, setPersistentEntries] = useState<MemoryEntry[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("session");

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/memory/list?agentId=${agentId}`
      );
      if (res.ok) {
        const data = await res.json();
        const session = (data.session || []).map((e: Record<string, unknown>) => ({
          key: e.key as string,
          value: typeof e.value === "string" ? e.value : JSON.stringify(e.value),
          tier: "session" as const,
        }));
        const persistent = (data.persistent || []).map((e: Record<string, unknown>) => ({
          key: e.key as string,
          value: typeof e.value === "string" ? e.value : JSON.stringify(e.value),
          tier: "persistent" as const,
          createdAt: e.createdAt as string,
          expiresAt: e.expiresAt as string | undefined,
        }));
        setSessionEntries(session);
        setPersistentEntries(persistent);
      }
    } catch {
      // Silently handle - memories may not be available
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArtifacts = async () => {
    try {
      const res = await fetch(
        `/api/artifacts/list?agentId=${agentId}`
      );
      if (res.ok) {
        const data = await res.json();
        setArtifacts(
          (data || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            name: (a.name as string) || "Untitled",
            type: (a.type as string) || "unknown",
            preview: a.preview as string | undefined,
            createdAt: a.createdAt as string,
          }))
        );
      }
    } catch {
      // Silently handle
    }
  };

  useEffect(() => {
    fetchMemories();
    fetchArtifacts();
  }, [agentId]);

  const handleDeletePersistent = async (key: string) => {
    try {
      await fetch(`/api/memory/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, key, value: null, tier: "persistent", delete: true }),
      });
      setPersistentEntries((prev) => prev.filter((e) => e.key !== key));
    } catch {
      // Silently handle
    }
  };

  const totalSession = sessionEntries.length;
  const totalPersistent = persistentEntries.length;
  const totalArtifacts = artifacts.length;

  return (
    <div className="w-full">
      {/* Summary badges */}
      <div className="flex items-center gap-1.5 mb-2">
        <Badge
          variant="secondary"
          className="text-[8px] px-1.5 py-0 h-4 bg-[#ffd60a]/15 text-[#ffd60a] border-0"
          style={{ borderRadius: 0 }}
        >
          <Brain size={8} className="mr-0.5" />
          {totalSession} session
        </Badge>
        <Badge
          variant="secondary"
          className="text-[8px] px-1.5 py-0 h-4 bg-[#3B82F6]/15 text-[#3B82F6] border-0"
          style={{ borderRadius: 0 }}
        >
          <HardDrive size={8} className="mr-0.5" />
          {totalPersistent} persistent
        </Badge>
        <Badge
          variant="secondary"
          className="text-[8px] px-1.5 py-0 h-4 bg-[#22C55E]/15 text-[#22C55E] border-0"
          style={{ borderRadius: 0 }}
        >
          <FileText size={8} className="mr-0.5" />
          {totalArtifacts} artifacts
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-7 w-full bg-[#0f141b] border border-[#2a3441] p-0" style={{ borderRadius: 0 }}>
          <TabsTrigger
            value="session"
            className="h-6 flex-1 text-[10px] data-[state=active]:bg-[#ffd60a]/20 data-[state=active]:text-[#ffd60a] text-[#5b6b81]"
            style={{ borderRadius: 0 }}
          >
            Session
          </TabsTrigger>
          <TabsTrigger
            value="persistent"
            className="h-6 flex-1 text-[10px] data-[state=active]:bg-[#3B82F6]/20 data-[state=active]:text-[#3B82F6] text-[#5b6b81]"
            style={{ borderRadius: 0 }}
          >
            Persistent
          </TabsTrigger>
          <TabsTrigger
            value="artifacts"
            className="h-6 flex-1 text-[10px] data-[state=active]:bg-[#22C55E]/20 data-[state=active]:text-[#22C55E] text-[#5b6b81]"
            style={{ borderRadius: 0 }}
          >
            Artifacts
          </TabsTrigger>
        </TabsList>

        {/* Session Tab */}
        <TabsContent value="session" className="mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="animate-spin text-[#ffd60a]" />
            </div>
          ) : sessionEntries.length === 0 ? (
            <p className="text-[10px] text-[#475569] py-3 text-center">
              No session memory entries
            </p>
          ) : (
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {sessionEntries.map((entry) => (
                  <Card
                    key={entry.key}
                    className="bg-[#0b1118] border-[#2a3441] p-2"
                    style={{ borderRadius: 0 }}
                  >
                    <div className="text-[9px] text-[#ffd60a] font-mono truncate">
                      {entry.key}
                    </div>
                    <p className="text-[10px] text-[#8a94a3] line-clamp-2 break-words mt-0.5">
                      {entry.value}
                    </p>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Persistent Tab */}
        <TabsContent value="persistent" className="mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="animate-spin text-[#3B82F6]" />
            </div>
          ) : persistentEntries.length === 0 ? (
            <p className="text-[10px] text-[#475569] py-3 text-center">
              No persistent memory entries
            </p>
          ) : (
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {persistentEntries.map((entry) => (
                  <Card
                    key={entry.key}
                    className="bg-[#0b1118] border-[#2a3441] p-2"
                    style={{ borderRadius: 0 }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] text-[#3B82F6] font-mono truncate">
                          {entry.key}
                        </div>
                        <p className="text-[10px] text-[#8a94a3] line-clamp-2 break-words mt-0.5">
                          {entry.value}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePersistent(entry.key)}
                        className="p-0.5 hover:bg-[#EF4444]/20 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        style={{ borderRadius: 0 }}
                      >
                        <Trash2 size={10} className="text-[#EF4444]" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Artifacts Tab */}
        <TabsContent value="artifacts" className="mt-2">
          {artifacts.length === 0 ? (
            <p className="text-[10px] text-[#475569] py-3 text-center">
              No artifacts
            </p>
          ) : (
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {artifacts.map((artifact) => (
                  <Card
                    key={artifact.id}
                    className="bg-[#0b1118] border-[#2a3441] p-2"
                    style={{ borderRadius: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-[#22C55E] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-[#d7dde5] font-medium truncate">
                          {artifact.name}
                        </div>
                        <div className="text-[9px] text-[#5b6b81]">
                          {artifact.type}
                        </div>
                      </div>
                    </div>
                    {artifact.preview && (
                      <p className="text-[9px] text-[#5b6b81] mt-1 line-clamp-2">
                        {artifact.preview}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Refresh button */}
      <div className="flex justify-end mt-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 text-[#475569] hover:text-[#8a94a3] hover:bg-[#2a3441]"
          style={{ borderRadius: 0 }}
          onClick={() => {
            fetchMemories();
            fetchArtifacts();
          }}
        >
          <RefreshCw size={10} />
        </Button>
      </div>
    </div>
  );
}
