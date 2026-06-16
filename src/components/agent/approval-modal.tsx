"use client";

import { useEffect, useState, useCallback } from "react";
import { useAgentStore, type ApprovalInfo } from "@/store/agent-store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

const riskColors: Record<string, string> = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

function ApprovalCard({
  approval,
  onApprove,
  onDeny,
  isProcessing,
}: {
  approval: ApprovalInfo;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  isProcessing: boolean;
}) {
  const [reason, setReason] = useState("");
  const riskColor = riskColors[approval.riskLevel] || riskColors.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-[#0b1118] border border-[#2a3441] p-4 space-y-3"
      style={{ borderRadius: 0 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#ffd60a]" />
          <span className="text-[13px] font-semibold text-[#d7dde5]">
            Approval Required
          </span>
        </div>
        <Badge
          variant="secondary"
          className="text-[9px] px-1.5 py-0 h-5 border-0 shrink-0"
          style={{ background: riskColor + "20", color: riskColor, borderRadius: 0 }}
        >
          {approval.riskLevel}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5b6b81] uppercase tracking-wider w-14 shrink-0">
            Agent
          </span>
          <span className="text-[11px] text-[#d7dde5] font-mono">
            {approval.agentId.slice(0, 8)}...
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5b6b81] uppercase tracking-wider w-14 shrink-0">
            Tool
          </span>
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 h-4 bg-[#2a3441] text-[#8a94a3] border-0"
            style={{ borderRadius: 0 }}
          >
            {approval.tool}
          </Badge>
        </div>
        <div>
          <span className="text-[10px] text-[#5b6b81] uppercase tracking-wider">
            Input
          </span>
          <p
            className="text-[11px] text-[#8a94a3] mt-0.5 p-2 bg-[#0f141b] line-clamp-3 whitespace-pre-wrap break-words"
            style={{ borderRadius: 0 }}
          >
            {approval.input}
          </p>
        </div>
      </div>

      {/* Reason input */}
      <div className="space-y-1">
        <span className="text-[10px] text-[#5b6b81] uppercase tracking-wider">
          Reason (optional)
        </span>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Add a reason for your decision..."
          rows={2}
          className="text-[11px] bg-[#0f141b] border-[#2a3441] text-[#d7dde5] focus:border-[#ffd60a] resize-none"
          style={{ borderRadius: 0 }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          onClick={() => onDeny(approval.id)}
          disabled={isProcessing}
          variant="outline"
          className="flex-1 h-8 text-[11px] gap-1.5 border-2 border-black"
          style={{ background: "#1a212b", color: "#EF4444", boxShadow: "2px 2px 0 #000" }}
        >
          {isProcessing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <XCircle size={12} />
          )}
          Deny
        </Button>
        <Button
          onClick={() => onApprove(approval.id)}
          disabled={isProcessing}
          className="flex-1 h-8 text-[11px] gap-1.5 border-2 border-black"
          style={{ background: "#ffd60a", color: "#000", boxShadow: "2px 2px 0 #000" }}
        >
          {isProcessing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle size={12} />
          )}
          Approve
        </Button>
      </div>
    </motion.div>
  );
}

export function ApprovalModal() {
  const {
    pendingApprovals,
    fetchPendingApprovals,
    respondApproval,
  } = useAgentStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch pending approvals on mount and periodically
  useEffect(() => {
    fetchPendingApprovals();
    const interval = setInterval(fetchPendingApprovals, 5000);
    return () => clearInterval(interval);
  }, [fetchPendingApprovals]);

  const handleRespond = useCallback(
    async (id: string, approved: boolean) => {
      setProcessingId(id);
      try {
        await respondApproval(id, approved);
      } finally {
        setProcessingId(null);
      }
    },
    [respondApproval]
  );

  const currentApproval = pendingApprovals.find((a) => a.status === "pending");

  if (!currentApproval) return null;

  return (
    <AlertDialog open={true}>
      <AlertDialogContent
        className="bg-[#0f141b] border-[#2a3441] text-[#d7dde5] max-w-md p-0 overflow-hidden"
        style={{ borderRadius: 0 }}
      >
        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>Approval Required</AlertDialogTitle>
          <AlertDialogDescription>
            An agent is requesting approval to execute a tool
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApprovalCard
          approval={currentApproval}
          onApprove={(id) => handleRespond(id, true)}
          onDeny={(id) => handleRespond(id, false)}
          isProcessing={processingId === currentApproval.id}
        />

        {/* Hidden footer for accessibility */}
        <AlertDialogFooter className="hidden">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
