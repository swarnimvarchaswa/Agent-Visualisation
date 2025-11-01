'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AgentPriceData {
  agentId: string;
  name: string;
  phoneNumber: string;
  hasFsmToken: boolean;
  totalEnquiries: number;
  totalInventories: number;
  resale: {
    count: number;
    totalPrice: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
  };
  rental: {
    count: number;
    totalPrice: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
  };
  overall: {
    count: number;
    averagePrice: number;
  };
}

interface PriceAnalyticsClientProps {
  agents: any;
  enquiries: any;
  properties: any;
}

export default function PriceAnalyticsClient({ agents, enquiries, properties }: PriceAnalyticsClientProps) {
  const [agentData, setAgentData] = useState<AgentPriceData[]>([]);
  const [filteredData, setFilteredData] = useState<AgentPriceData[]>([]);
  const [uniqueResaleProps, setUniqueResaleProps] = useState<Set<string>>(new Set());
  const [uniqueRentalProps, setUniqueRentalProps] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'all' | 'resale' | 'rental'>('all');
  const [filterFsmToken, setFilterFsmToken] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'avgPrice' | 'enquiries'>('avgPrice');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [agentData, searchTerm, propertyTypeFilter, filterFsmToken, sortBy]);

  const processData = () => {
    setLoading(true);
    
    const processedData: AgentPriceData[] = [];
    const allResaleProps = new Set<string>();
    const allRentalProps = new Set<string>();

    for (const [agentId, agentInfo] of Object.entries(agents)) {
      const enquiryDid = (agentInfo as any).enquiryDid || [];
      const myInventories = (agentInfo as any).myInventories || [];
      
      const resalePrices: number[] = [];
      const rentalPrices: number[] = [];

      // Process enquiries
      for (const enquiryId of enquiryDid) {
        const enquiry = enquiries[enquiryId];
        if (enquiry && enquiry.propertyId) {
          const property = properties[enquiry.propertyId];
          if (property) {
            // resale price is under pricing.totalAskPrice
            if (property.listingType === 'resale') {
              const rp = (property.pricing && property.pricing.totalAskPrice) || property.totalAskPrice || 0;
              if (rp && rp > 0) {
                resalePrices.push(rp);
                allResaleProps.add(enquiry.propertyId);
              }
            }
            // rental price is under rentalInfo.rent (or rentalIncome)
            if (property.listingType === 'rental') {
              const rent = (property.rentalInfo && (property.rentalInfo.rent || property.rentalInfo.rentalIncome)) || 0;
              if (rent && rent > 0) {
                rentalPrices.push(rent);
                allRentalProps.add(enquiry.propertyId);
              }
            }
          }
        }
      }

      // Process inventories (use propertyId directly)
      for (const propertyId of myInventories) {
        const property = properties[propertyId];
        if (!property) continue;
        if (property.listingType === 'resale') {
          const rp = (property.pricing && property.pricing.totalAskPrice) || property.totalAskPrice || 0;
          if (rp && rp > 0) {
            resalePrices.push(rp);
            allResaleProps.add(propertyId);
          }
        } else if (property.listingType === 'rental') {
          const rent = (property.rentalInfo && (property.rentalInfo.rent || property.rentalInfo.rentalIncome)) || 0;
          if (rent && rent > 0) {
            rentalPrices.push(rent);
            allRentalProps.add(propertyId);
          }
        }
      }      const resaleCount = resalePrices.length;
      const rentalCount = rentalPrices.length;
      const totalCount = resaleCount + rentalCount;

      // Don't skip - show all agents even with no price data
      const resaleTotal = resalePrices.reduce((sum, p) => sum + p, 0);
      const rentalTotal = rentalPrices.reduce((sum, p) => sum + p, 0);

      const agentPriceData: AgentPriceData = {
        agentId,
        name: (agentInfo as any).name || agentId,
        phoneNumber: (agentInfo as any).phoneNumber || '',
        hasFsmToken: Boolean((agentInfo as any).fsmToken && Array.isArray((agentInfo as any).fsmToken) && (agentInfo as any).fsmToken.length > 0),
        totalEnquiries: enquiryDid.length,
        totalInventories: myInventories.length,
        resale: {
          count: resaleCount,
          totalPrice: resaleTotal,
          averagePrice: resaleCount > 0 ? resaleTotal / resaleCount : 0,
          minPrice: resaleCount > 0 ? Math.min(...resalePrices) : 0,
          maxPrice: resaleCount > 0 ? Math.max(...resalePrices) : 0,
        },
        rental: {
          count: rentalCount,
          totalPrice: rentalTotal,
          averagePrice: rentalCount > 0 ? rentalTotal / rentalCount : 0,
          minPrice: rentalCount > 0 ? Math.min(...rentalPrices) : 0,
          maxPrice: rentalCount > 0 ? Math.max(...rentalPrices) : 0,
        },
        overall: {
          count: totalCount,
          averagePrice: totalCount > 0 ? (resaleTotal + rentalTotal) / totalCount : 0,
        },
      };

      processedData.push(agentPriceData);
    }

    setAgentData(processedData);
    setUniqueResaleProps(allResaleProps);
    setUniqueRentalProps(allRentalProps);
    setLoading(false);
  };

  const filterAndSortData = () => {
    let filtered = [...agentData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.agentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // FSM Token filter
    if (filterFsmToken) {
      filtered = filtered.filter((agent) => agent.hasFsmToken);
    }

    // Property type filter
    if (propertyTypeFilter === 'resale') {
      filtered = filtered.filter((agent) => agent.resale.count > 0);
    } else if (propertyTypeFilter === 'rental') {
      filtered = filtered.filter((agent) => agent.rental.count > 0);
    }

    // Sort: group by listing presence (resale -> rental -> none), then apply selected sort
    const listingGroup = (agent: AgentPriceData) => {
      if (agent.resale.count > 0) return 0;
      if (agent.rental.count > 0) return 1;
      return 2;
    };

    filtered.sort((a, b) => {
      const ga = listingGroup(a);
      const gb = listingGroup(b);
      if (ga !== gb) return ga - gb;

      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === 'avgPrice') {
        const aPrice = propertyTypeFilter === 'resale' ? a.resale.averagePrice :
                       propertyTypeFilter === 'rental' ? a.rental.averagePrice :
                       a.overall.averagePrice;
        const bPrice = propertyTypeFilter === 'resale' ? b.resale.averagePrice :
                       propertyTypeFilter === 'rental' ? b.rental.averagePrice :
                       b.overall.averagePrice;
        return bPrice - aPrice;
      }

      if (sortBy === 'enquiries') {
        return b.totalEnquiries - a.totalEnquiries;
      }

      return 0;
    });

    setFilteredData(filtered);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(2)} K`;
    }
    return `₹${price.toFixed(0)}`;
  };

  const getStatsForFilter = () => {
    const totalAgents = filteredData.length;
    
    // Count unique properties from all agents (not filtered)
    const totalUniqueResale = uniqueResaleProps.size;
    const totalUniqueRental = uniqueRentalProps.size;
    const totalUniqueProperties = totalUniqueResale + totalUniqueRental;
    
    // Total instances (can be duplicates across agents)
    const totalResaleInstances = filteredData.reduce((sum, a) => sum + a.resale.count, 0);
    const totalRentalInstances = filteredData.reduce((sum, a) => sum + a.rental.count, 0);
    
    const avgOverallPrice = filteredData.length > 0
      ? filteredData.reduce((sum, a) => sum + a.overall.averagePrice, 0) / filteredData.length
      : 0;

    return { 
      totalAgents, 
      totalUniqueResale, 
      totalUniqueRental, 
      totalUniqueProperties,
      totalResaleInstances,
      totalRentalInstances,
      avgOverallPrice 
    };
  };

  const stats = getStatsForFilter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Loading Price Analytics...</h2>
          <p className="text-gray-500 mt-2">Processing {Object.keys(agents).length} agents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  💰 Price Analytics
                </h1>
                <p className="text-sm text-gray-600">Average property prices per agent</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.totalAgents}</div>
              <div className="text-xs text-blue-600">Total Agents</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{stats.totalUniqueProperties}</div>
              <div className="text-xs text-orange-600">Unique Properties</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{stats.totalUniqueResale}</div>
              <div className="text-xs text-purple-600">Resale Properties</div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
              <div className="text-2xl font-bold text-pink-700">{stats.totalUniqueRental}</div>
              <div className="text-xs text-pink-600">Rental Properties</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{formatPrice(stats.avgOverallPrice)}</div>
              <div className="text-xs text-green-600">Avg Price</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            {/* Property Type Filter */}
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPropertyTypeFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  propertyTypeFilter === 'all'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPropertyTypeFilter('resale')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  propertyTypeFilter === 'resale'
                    ? 'bg-purple-500 text-white shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Resale
              </button>
              <button
                onClick={() => setPropertyTypeFilter('rental')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  propertyTypeFilter === 'rental'
                    ? 'bg-pink-500 text-white shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Rental
              </button>
            </div>

            {/* FSM Token Filter */}
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
              <input
                type="checkbox"
                checked={filterFsmToken}
                onChange={(e) => setFilterFsmToken(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">FSM Token Only</span>
            </label>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="avgPrice">Highest Avg Price</option>
              <option value="enquiries">Most Enquiries</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Compact Table View */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">FSM</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Agent</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Enquiries</th>
                  {(propertyTypeFilter === 'all' || propertyTypeFilter === 'resale') && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-purple-600">Resale Avg</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-purple-600">Count</th>
                    </>
                  )}
                  {(propertyTypeFilter === 'all' || propertyTypeFilter === 'rental') && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-pink-600">Rental Avg</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-pink-600">Count</th>
                    </>
                  )}
                  {propertyTypeFilter === 'all' && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-green-600">Overall Avg</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        {agent.hasFsmToken ? (
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500" title="Has FSM token" />
                        ) : (
                          <span className="inline-block w-3 h-3 rounded-full bg-gray-300" title="No FSM" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 text-sm">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.agentId}</div>
                      </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">{agent.totalEnquiries}</td>
                    {(propertyTypeFilter === 'all' || propertyTypeFilter === 'resale') && (
                      <>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-purple-700">
                          {agent.resale.count > 0 ? formatPrice(agent.resale.averagePrice) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-purple-600">
                          {agent.resale.count > 0 ? agent.resale.count : '-'}
                        </td>
                      </>
                    )}
                    {(propertyTypeFilter === 'all' || propertyTypeFilter === 'rental') && (
                      <>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-pink-700">
                          {agent.rental.count > 0 ? formatPrice(agent.rental.averagePrice) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-pink-600">
                          {agent.rental.count > 0 ? agent.rental.count : '-'}
                        </td>
                      </>
                    )}
                    {propertyTypeFilter === 'all' && (
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">
                        {agent.overall.count > 0 ? formatPrice(agent.overall.averagePrice) : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No agents found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
