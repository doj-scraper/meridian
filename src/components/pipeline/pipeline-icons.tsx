// ═══════════════════════════════════════════════════════════════════════
// PIPELINE ICONS — SVG icon glyphs keyed by the workflow's `icon` field.
// Converted from Icons.jsx to TypeScript with proper typing.
// ═══════════════════════════════════════════════════════════════════════

import React from "react";

const ICONS: Record<string, React.ReactNode> = {
  commit: (<><rect x="5" y="4" width="14" height="16" rx="2" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></>),
  branch: (<><path d="M7,6 L7,18" strokeDasharray="2 2" /><circle cx="7" cy="6" r="2" /><circle cx="17" cy="18" r="2" /><path d="M7,6 C7,12 17,12 17,18" /></>),
  pr: (<><path d="M6,18 L6,6" /><path d="M18,18 L18,6" /><path d="M6,12 C9,12 12,9 12,6 L18,6" /></>),
  traffic: (<><rect x="8" y="3" width="8" height="18" rx="2" /><circle cx="12" cy="7" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="17" r="1.5" /></>),
  lint: (<><rect x="4" y="16" width="16" height="4" rx="1" /><path d="M14,4 L9,9 L11,11 L16,6" /></>),
  static: (<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9,9 L9,15" /><path d="M15,9 L15,15" /></>),
  unit: (<path d="M9,3 L15,3 L15,8 C15,8 17,21 12,21 C7,21 9,8 9,8 L9,3 Z" />),
  fail: (<><path d="M10.5,12 L13.5,16" /><path d="M13.5,12 L10.5,16" /><circle cx="12" cy="14" r="8" /></>),
  flag: (<><rect x="3" y="7" width="18" height="10" rx="5" /><circle cx="8" cy="12" r="3" /></>),
  build: (<><path d="M12,22 L12,12" /><path d="M4,18 L12,22 L20,18" /><path d="M4,18 L4,10 L12,14 L20,10 L20,18" /><path d="M12,12 L20,8 L12,4 L4,8 L12,12" /></>),
  compile: (<><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>),
  cache: (<path d="M13,3 L4,14 H12 L11,21 L20,10 H12 L13,3 Z" />),
  artifact: (<path d="M12,3 L20,7.5 V16.5 L12,21 L4,16.5 V7.5 L12,3 Z" />),
  container: (<><rect x="3" y="15" width="18" height="6" rx="2" /><rect x="5" y="9" width="14" height="4" rx="1" opacity="0.7" /></>),
  env: (<><rect x="4" y="3" width="16" height="18" rx="2" /><line x1="4" y1="9" x2="20" y2="9" /></>),
  security: (<><path d="M12,3 L4,7 V12 C4,17 7.5,20.5 12,21 C16.5,20.5 20,17 20,12 V7 L12,3 Z" /><circle cx="12" cy="12" r="3" /></>),
  rollout: (<><rect x="3" y="10" width="18" height="4" rx="2" opacity="0.3" /><line x1="3" y1="12" x2="14" y2="12" strokeWidth="4" strokeLinecap="round" /></>),
  logs: (<><rect x="4" y="4" width="16" height="16" rx="2" /><line x1="7" y1="8" x2="14" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /></>),
  deploy: (<><path d="M22,2 L11,13" /><path d="M22,2 L15,22 L11,13 L2,9 L22,2 Z" /></>),
  monitor: (<><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M3,13 L8,9 L12,12 L17,7 L21,11" /></>),
  broken: (<><rect x="4" y="4" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /><path d="M12,12 L16,8" /></>),
  rollback: (<><path d="M3,12 A9,9 0 1,0 6,5.5" /><path d="M12,8 L12,12 L15,15" /></>),
  alert: (<><path d="M12,3 L21,19 L3,19 L12,3 Z" /><line x1="12" y1="14" x2="12" y2="16" /></>),
  success: (<><circle cx="12" cy="12" r="9" /><path d="M8,12 L11,15 L16,9" /></>),
  data: (<><path d="M3,12 L21,12" /><circle cx="3" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="21" cy="12" r="2" /></>),
};

interface PipelineIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PipelineIcon({ name, className, style }: PipelineIconProps) {
  const glyph = ICONS[name] || ICONS.commit;
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      {glyph}
    </svg>
  );
}

export { ICONS };
