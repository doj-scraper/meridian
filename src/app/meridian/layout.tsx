import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meridian Runtime | Agent Studio OS',
  description: 'Event-driven command center for agentic workflows',
};

export default function MeridianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
