import ZoneAnalyticsClient from './ZoneAnalyticsClient';
import agentsData from '@/data/agents.json';
import enquiriesData from '@/data/enquiries.json';
import propertiesData from '@/data/properties.json';

export default function ZoneAnalyticsPage() {
  return (
    <main className="w-screen h-screen overflow-y-auto overflow-x-hidden">
      <ZoneAnalyticsClient 
        agents={agentsData}
        enquiries={enquiriesData}
        properties={propertiesData}
      />
    </main>
  );
}
