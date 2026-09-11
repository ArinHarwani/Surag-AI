'use client';

import { NexusShell } from '@/components/nexus/NexusShell';

export default function Home() {
  return <NexusShell initialTab="overview" scopedAgency="all" />;
}
