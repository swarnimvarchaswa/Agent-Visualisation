'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AgentZoneData {
  agentId: string;
  name: string;
  phoneNumber: string;
  hasFsmToken: boolean;
  totalEnquiries: number;
  totalInventories: number;
  areaOfOperation: string[];
  zones: {
    [key: string]: {
      count: number;
      percentage: number;
    };
  };
  enquiryZones: {
    [key: string]: number;
  };
  inventoryZones: {
    [key: string]: number;
  };
}

interface ZoneAnalyticsClientProps {
  agents: any;
  enquiries: any;
  properties: any;
}

const ZONE_COLORS: { [key: string]: string } = {
  'North Bangalore': '#60a5fa', // light blue
  'South Bangalore': '#34d399', // light green
  'East Bangalore': '#fbbf24',  // light amber
  'West Bangalore': '#f87171',  // light red
  'Central Bangalore': '#a78bfa', // light purple
  'No Zone Data': '#e5e7eb',  // very light gray
  'Other': '#9ca3af'  // light gray
};

export default function ZoneAnalyticsClient({ agents, enquiries, properties }: ZoneAnalyticsClientProps) {
  const [agentData, setAgentData] = useState<AgentZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFsmToken, setFilterFsmToken] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'enquiries' | 'inventories'>('enquiries');

  useEffect(() => {
    processData();
  }, []);

  const processData = () => {
    try {
      const processedData: AgentZoneData[] = [];

      // Helper function to normalize zone names
      const normalizeZone = (zone: string): string => {
        if (!zone) return 'No Zone Data';
        const zoneLower = zone.toLowerCase().trim();
        
        if (zoneLower.includes('north') || zoneLower === 'north') return 'North Bangalore';
        if (zoneLower.includes('south') || zoneLower === 'south') return 'South Bangalore';
        if (zoneLower.includes('east') || zoneLower === 'east') return 'East Bangalore';
        if (zoneLower.includes('west') || zoneLower === 'west') return 'West Bangalore';
        if (zoneLower.includes('central') || zoneLower === 'central') return 'Central Bangalore';
        
        return zone;
      };

      for (const [agentId, agentInfo] of Object.entries(agents) as any) {
        const hasFsmToken = agentInfo.fsmToken && Array.isArray(agentInfo.fsmToken) && agentInfo.fsmToken.length > 0;
        
        const enquiryDid = agentInfo.enquiryDid || [];
        const myInventories = agentInfo.myInventories || [];

        const enquiryZones: { [key: string]: number } = {};
        const inventoryZones: { [key: string]: number } = {};

        // Process enquiries
        for (const enquiryId of enquiryDid) {
          const enquiry = enquiries[enquiryId];
          if (enquiry && enquiry.propertyId) {
            const property = properties[enquiry.propertyId];
            if (property && property.zone) {
              const zone = normalizeZone(property.zone);
              enquiryZones[zone] = (enquiryZones[zone] || 0) + 1;
            } else {
              enquiryZones['No Zone Data'] = (enquiryZones['No Zone Data'] || 0) + 1;
            }
          } else {
            enquiryZones['No Zone Data'] = (enquiryZones['No Zone Data'] || 0) + 1;
          }
        }

        // Process inventories
        for (const propertyId of myInventories) {
          const property = properties[propertyId];
          if (property && property.zone) {
            const zone = normalizeZone(property.zone);
            inventoryZones[zone] = (inventoryZones[zone] || 0) + 1;
          } else if (property && !property.zone) {
            inventoryZones['No Zone Data'] = (inventoryZones['No Zone Data'] || 0) + 1;
          }
        }

        // Combine zones
        const allZones = new Set([...Object.keys(enquiryZones), ...Object.keys(inventoryZones)]);
        const zones: { [key: string]: { count: number; percentage: number } } = {};
        
        // Calculate total count only for items that have zone data
        const totalCountWithZones = Object.values(enquiryZones).reduce((a, b) => a + b, 0) + 
                                    Object.values(inventoryZones).reduce((a, b) => a + b, 0);
        
        Array.from(allZones).forEach(zone => {
          const count = (enquiryZones[zone] || 0) + (inventoryZones[zone] || 0);
          zones[zone] = {
            count,
            percentage: totalCountWithZones > 0 ? (count / totalCountWithZones) * 100 : 0
          };
        });

        processedData.push({
          agentId,
          name: agentInfo.name || 'N/A',
          phoneNumber: agentInfo.phoneNumber || 'N/A',
          hasFsmToken,
          totalEnquiries: enquiryDid.length,
          totalInventories: myInventories.length,
          areaOfOperation: agentInfo.areaOfOperation || [],
          zones,
          enquiryZones,
          inventoryZones
        });
      }

      setAgentData(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error processing data:', error);
      setLoading(false);
    }
  };

  const filteredData = agentData
    .filter(agent => {
      if (filterFsmToken && !agent.hasFsmToken) return false;
      if (searchTerm && !agent.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !agent.agentId.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'enquiries') return b.totalEnquiries - a.totalEnquiries;
      if (sortBy === 'inventories') return b.totalInventories - a.totalInventories;
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-800 text-2xl">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Zone Analytics</h1>
            </div>
            <div className="text-gray-600 font-semibold">
              {filteredData.length} / {agentData.length} agents
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
            
            <label className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filterFsmToken}
                onChange={(e) => setFilterFsmToken(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Has FSM Token</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white rounded-lg border border-gray-300 outline-none cursor-pointer hover:bg-gray-50"
            >
              <option value="enquiries">Sort by Enquiries</option>
              <option value="inventories">Sort by Inventories</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">ZONES</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(ZONE_COLORS).map(([zone, color]) => (
              <div key={zone} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-sm text-gray-700">{zone}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="space-y-3">
          {filteredData.map((agent) => {
            const totalActivity = agent.totalEnquiries + agent.totalInventories;
            
            return (
              <div
                key={agent.agentId}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Agent Info - Left Side */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-800">{agent.agentId}</h3>
                      {agent.hasFsmToken && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded shadow-sm">FSM</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm font-medium">{agent.name}</p>
                    {agent.areaOfOperation && agent.areaOfOperation.length > 0 && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        📍 {agent.areaOfOperation.join(', ')}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="text-blue-600 font-medium">{agent.totalEnquiries} enquiries</span>
                      {' • '}
                      <span className="text-purple-600 font-medium">{agent.totalInventories} properties</span>
                    </div>
                  </div>

                  {/* Zone Bar - Right Side */}
                  <div className="col-span-9">
                    {totalActivity > 0 ? (
                      <div>
                        <div className="flex h-8 rounded-lg overflow-hidden mb-2 shadow-sm">
                          {Object.entries(agent.zones)
                            .sort((a, b) => b[1].percentage - a[1].percentage)
                            .map(([zone, data]) => (
                              <div
                                key={zone}
                                style={{
                                  width: `${data.percentage}%`,
                                  backgroundColor: ZONE_COLORS[zone] || ZONE_COLORS['Other']
                                }}
                                className="relative group"
                                title={`${zone}: ${data.count} (${data.percentage.toFixed(1)}%)`}
                              >
                                {data.percentage > 10 && (
                                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                    {data.percentage.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                        
                        {/* Zone Details */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {Object.entries(agent.zones)
                            .sort((a, b) => b[1].count - a[1].count)
                            .map(([zone, data]) => (
                              <div key={zone} className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full shadow-sm" 
                                  style={{ backgroundColor: ZONE_COLORS[zone] || ZONE_COLORS['Other'] }}
                                />
                                <span className="text-gray-600">
                                  {zone}: {data.count}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">No activity</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
