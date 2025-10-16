import AgentVisualizer from '@/components/AgentVisualizer';
import agentsData from '@/data/agents.json';
import { IAgent, AgentData } from '@/lib/types';

export default function AgentVisualizerPage() {
  // Convert the object-based data to an array
  const agentsArray: IAgent[] = Object.values(agentsData as AgentData);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <AgentVisualizer agents={agentsArray} />
    </main>
  );
}
