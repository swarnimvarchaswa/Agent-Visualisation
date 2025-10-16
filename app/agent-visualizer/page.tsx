import AgentVisualizer from '@/components/AgentVisualizer';
import agentsData from '@/data/agents.json';
import { IAgent } from '@/lib/types';

export default function AgentVisualizerPage() {
  // Convert the object-based data to an array, handling any data structure
  const agentsArray: IAgent[] = Object.values(agentsData as Record<string, any>);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <AgentVisualizer agents={agentsArray} />
    </main>
  );
}
