import AgentVisualizer from '@/components/AgentVisualizer';
import agentsData from '@/data/agents.json';
import { IAgent } from '@/lib/types';

export default function AgentVisualizerPage() {
  // Normalize raw JSON to ensure consistent fields for all agents
  const agentsArray: IAgent[] = Object.entries(agentsData as Record<string, any>)
    .map(([cpId, raw]) => {
      // Count properties from myInventories array
      const noOfInventories: number = Array.isArray(raw?.myInventories)
        ? raw.myInventories.length
        : 0;

      // Count enquiries from enquiryDid array
      const noOfEnquiries: number = Array.isArray(raw?.enquiryDid)
        ? raw.enquiryDid.length
        : 0;

      const normalizedUserType: string = (raw?.userType ?? 'basic').toString().toLowerCase();

      // Keep only fields used by the visualizer to reduce payload size
      const normalized: IAgent = {
        cpId: (raw?.cpId as string) || cpId,
        name: raw?.name ?? undefined,
        kamName: raw?.kamName ?? undefined,
        userType: normalizedUserType,
        noOfInventories,
        noOfEnquiries,
      };

      return normalized;
    });

  return (
    <main className="w-screen h-screen overflow-hidden">
      <AgentVisualizer agents={agentsArray} />
    </main>
  );
}
