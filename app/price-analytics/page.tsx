import PriceAnalyticsClient from './PriceAnalyticsClient';
import agentsData from '@/data/agents.json';
import enquiriesData from '@/data/enquiries.json';
import propertiesData from '@/data/properties.json';

export default function PriceAnalyticsPage() {
  return (
    <main className="w-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
      <PriceAnalyticsClient 
        agents={agentsData}
        enquiries={enquiriesData}
        properties={propertiesData}
      />
    </main>
  );
}
