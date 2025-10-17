'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { IAgent, UserType } from '@/lib/types';

interface AgentVisualizerProps {
  agents: IAgent[];
}

interface ChartDataPoint {
  name: string;
  kamName: string;
  noOfInventories: number;
  noOfEnquiries: number;
  userType: string;
  cpId: string;
}

const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ agents }) => {
  const [selectedKam, setSelectedKam] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<UserType>('all');
  
  // Axis range inputs - what user types
  const [xMin, setXMin] = useState<string>('');
  const [xMax, setXMax] = useState<string>('');
  const [yMin, setYMin] = useState<string>('');
  const [yMax, setYMax] = useState<string>('');
  
  // Applied values - used for actual graph rendering
  const [appliedXMin, setAppliedXMin] = useState<string>('');
  const [appliedXMax, setAppliedXMax] = useState<string>('');
  const [appliedYMin, setAppliedYMin] = useState<string>('');
  const [appliedYMax, setAppliedYMax] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Pinned tooltip state
  const [pinnedAgents, setPinnedAgents] = useState<IAgent[] | null>(null);
  const [pinnedPosition, setPinnedPosition] = useState<{ x: number; y: number } | null>(null);
  const [suppressHoverTooltip, setSuppressHoverTooltip] = useState(false);
  const [suppressedCoordinates, setSuppressedCoordinates] = useState<string | null>(null);
  const pinnedTooltipRef = useRef<HTMLDivElement>(null);
  const suppressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // Helper function to close pinned tooltip
  const closePinnedTooltip = () => {
    // Store the coordinates that should be suppressed
    if (pinnedAgents && pinnedAgents.length > 0) {
      const coords = `${pinnedAgents[0].noOfEnquiries}_${pinnedAgents[0].noOfInventories}`;
      setSuppressedCoordinates(coords);
    }
    
    // Store current mouse position to compare later
    lastMousePositionRef.current = pinnedPosition;
    
    setPinnedAgents(null);
    setPinnedPosition(null);
    setSuppressHoverTooltip(true);
    
    // Clear any existing timeout
    if (suppressTimeoutRef.current) {
      clearTimeout(suppressTimeoutRef.current);
    }
    
    // Re-enable hover tooltip after a delay
    suppressTimeoutRef.current = setTimeout(() => {
      setSuppressHoverTooltip(false);
      setSuppressedCoordinates(null);
      lastMousePositionRef.current = null;
    }, 300);
  };

  // Close pinned tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pinnedTooltipRef.current && !pinnedTooltipRef.current.contains(event.target as Node)) {
        closePinnedTooltip();
      }
    };

    if (pinnedAgents) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clear timeout on unmount
      if (suppressTimeoutRef.current) {
        clearTimeout(suppressTimeoutRef.current);
      }
    };
  }, [pinnedAgents]);

  // Extract unique KAM names
  const kamNames = useMemo(() => {
    const names = new Set(agents.map(agent => agent.kamName).filter(Boolean));
    return Array.from(names).sort();
  }, [agents]);

  // Calculate default axis ranges with margin
  const axisRanges = useMemo(() => {
    const xValues = agents.map(a => a.noOfEnquiries).filter(v => v != null);
    const yValues = agents.map(a => a.noOfInventories).filter(v => v != null);
    
    const maxX = Math.max(...xValues, 0);
    const maxY = Math.max(...yValues, 0);
    
    // Add 10% margin
    const xMargin = Math.ceil(maxX * 0.1);
    const yMargin = Math.ceil(maxY * 0.1);
    
    return {
      maxX: maxX + xMargin,
      maxY: maxY + yMargin,
      minX: 0,
      minY: 0,
    };
  }, [agents]);

  // Get axis domain from APPLIED inputs or defaults
  const axisDomain = useMemo(() => {
    const xMinVal = appliedXMin !== '' ? Number(appliedXMin) : axisRanges.minX;
    const xMaxVal = appliedXMax !== '' ? Number(appliedXMax) : axisRanges.maxX;
    const yMinVal = appliedYMin !== '' ? Number(appliedYMin) : axisRanges.minY;
    const yMaxVal = appliedYMax !== '' ? Number(appliedYMax) : axisRanges.maxY;
    
    return {
      xMin: isNaN(xMinVal) ? axisRanges.minX : xMinVal,
      xMax: isNaN(xMaxVal) ? axisRanges.maxX : xMaxVal,
      yMin: isNaN(yMinVal) ? axisRanges.minY : yMinVal,
      yMax: isNaN(yMaxVal) ? axisRanges.maxY : yMaxVal,
    };
  }, [appliedXMin, appliedXMax, appliedYMin, appliedYMax, axisRanges]);

  // Apply values with loader
  const applyValues = () => {
    setIsLoading(true);
    // Use requestAnimationFrame for smooth update
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAppliedXMin(xMin);
        setAppliedXMax(xMax);
        setAppliedYMin(yMin);
        setAppliedYMax(yMax);
        // Keep loading longer to ensure chart fully renders with data
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      });
    });
  };

  // Handle reset
  const handleReset = () => {
    setXMin('');
    setXMax('');
    setYMin('');
    setYMax('');
    setAppliedXMin('');
    setAppliedXMax('');
    setAppliedYMin('');
    setAppliedYMax('');
    setSelectedKam('all');
    setSelectedUserType('all');
  };

  // Filter agents based on selected filters
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Skip agents without userType
      if (!agent.userType) return false;
      
      const matchesKam = selectedKam === 'all' || agent.kamName === selectedKam;
      
      // Normalize userType to lowercase for comparison
      const normalizedUserType = agent.userType.toLowerCase();
      const matchesUserType = selectedUserType === 'all' || normalizedUserType === selectedUserType;
      
      return matchesKam && matchesUserType;
    });
  }, [agents, selectedKam, selectedUserType]);

  // Prepare data for different user types with overlap detection
  const chartData = useMemo(() => {
    const premium: ChartDataPoint[] = [];
    const trial: ChartDataPoint[] = [];
    const basic: ChartDataPoint[] = [];

    // Group agents by position to detect overlaps
    const positionMap = new Map<string, IAgent[]>();

    filteredAgents.forEach(agent => {
      if (!agent.userType) return;
      // Skip agents without valid coordinates
      if (agent.noOfEnquiries == null || agent.noOfInventories == null) return;
      
      const posKey = `${agent.noOfEnquiries}_${agent.noOfInventories}`;
      if (!positionMap.has(posKey)) {
        positionMap.set(posKey, []);
      }
      positionMap.get(posKey)!.push(agent);
    });

    // Create data points with overlap info
    filteredAgents.forEach(agent => {
      if (!agent.userType) return;
      // Skip agents without valid coordinates
      if (agent.noOfEnquiries == null || agent.noOfInventories == null) return;
      
      const posKey = `${agent.noOfEnquiries}_${agent.noOfInventories}`;
      const agentsAtPosition = positionMap.get(posKey) || [];
      
      const dataPoint: ChartDataPoint & { overlapCount?: number; allAgents?: IAgent[] } = {
        name: agent.name || 'Unknown',
        kamName: agent.kamName || 'N/A',
        noOfInventories: agent.noOfInventories || 0,
        noOfEnquiries: agent.noOfEnquiries || 0,
        userType: agent.userType,
        cpId: agent.cpId,
        overlapCount: agentsAtPosition.length,
        allAgents: agentsAtPosition,
      };

      const normalizedType = agent.userType.toLowerCase();

      if (normalizedType === 'premium') {
        premium.push(dataPoint);
      } else if (normalizedType === 'trial') {
        trial.push(dataPoint);
      } else {
        basic.push(dataPoint);
      }
    });

    return { premium, trial, basic };
  }, [filteredAgents]);

  // Count agents in the current visible range
  const visibleAgentsCount = useMemo(() => {
    // If using default axis ranges (no filter applied), count all filtered agents
    const isDefaultRange = appliedXMin === '' && appliedXMax === '' && 
                          appliedYMin === '' && appliedYMax === '';
    
    if (isDefaultRange) {
      // Return total count of filtered agents
      return filteredAgents.length;
    }

    // When range is specified, count agents within that range
    const xMin = axisDomain.xMin;
    const xMax = axisDomain.xMax;
    const yMin = axisDomain.yMin;
    const yMax = axisDomain.yMax;

    // Use a Set to track unique positions we've already counted
    const countedPositions = new Set<string>();
    let count = 0;
    
    // Helper function to count agents at a position
    const countFromDataPoints = (dataPoints: any[]) => {
      dataPoints.forEach(point => {
        if (point.noOfEnquiries >= xMin && point.noOfEnquiries <= xMax &&
            point.noOfInventories >= yMin && point.noOfInventories <= yMax) {
          const posKey = `${point.noOfEnquiries}_${point.noOfInventories}`;
          
          // Only count this position once (since allAgents contains all agents at this position)
          if (!countedPositions.has(posKey)) {
            countedPositions.add(posKey);
            // Count all agents at this position
            count += (point.allAgents?.length || 1);
          }
        }
      });
    };
    
    // Count from all data types
    countFromDataPoints(chartData.premium);
    countFromDataPoints(chartData.trial);
    countFromDataPoints(chartData.basic);

    return count;
  }, [chartData, axisDomain, appliedXMin, appliedXMax, appliedYMin, appliedYMax, filteredAgents]);

  // Custom tooltip - shows all agents at same position (hover only if not pinned)
  const CustomTooltip = ({ active, payload }: any) => {
    // Don't show hover tooltip if there's a pinned tooltip or if suppressed
    if (pinnedAgents || suppressHoverTooltip) return null;
    
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const allAgents = data.allAgents || [data];
      const overlapCount = data.overlapCount || 1;
      
      // Check if this is the suppressed coordinate position
      const currentCoords = `${data.noOfEnquiries}_${data.noOfInventories}`;
      if (suppressedCoordinates === currentCoords) return null;
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-gray-300 max-h-96 overflow-y-auto pointer-events-none">
          {/* Header with position info */}
          <div className="mb-2 pb-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-700">
              Position: {data.noOfEnquiries} Enq, {data.noOfInventories} Props
            </p>
            {overlapCount > 1 && (
              <p className="text-xs font-bold text-orange-600 mt-1">
                {overlapCount} Agents at this location
              </p>
            )}
            <p className="text-xs text-blue-600 mt-1 italic">
              Click to pin
            </p>
          </div>

          {/* List all agents */}
          <div className="space-y-3">
            {allAgents.slice(0, 3).map((agent: IAgent, idx: number) => (
              <div 
                key={agent.cpId || idx} 
                className={`pb-2 ${idx !== allAgents.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <p className="font-bold text-gray-900 text-sm mb-1">
                  {agent.name || 'Unknown'}
                </p>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p><span className="font-semibold">CP ID:</span> {agent.cpId}</p>
                  <p><span className="font-semibold">KAM:</span> {agent.kamName || 'N/A'}</p>
                  <p>
                    <span className="font-semibold">Type:</span>{' '}
                    <span className="capitalize font-medium">{agent.userType || 'N/A'}</span>
                  </p>
                </div>
              </div>
            ))}
            {allAgents.length > 3 && (
              <p className="text-xs text-gray-500 italic">
                +{allAgents.length - 3} more... (click to see all)
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header with Filters - Minimal */}
      <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">Agent Analytics</h1>
          <div className="text-xs text-gray-600">
            <span className="font-semibold">{filteredAgents.length}</span> agents
          </div>
        </div>

        {/* Filters on Right */}
        <div className="flex items-center gap-2">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Reset
          </button>

          {/* KAM Filter */}
          <select
            value={selectedKam}
            onChange={(e) => setSelectedKam(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="all">All KAMs</option>
            {kamNames.map((kamName) => (
              <option key={kamName} value={kamName}>
                {kamName}
              </option>
            ))}
          </select>

          {/* User Type Filter */}
          <select
            value={selectedUserType}
            onChange={(e) => setSelectedUserType(e.target.value as UserType)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="premium">Premium</option>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
          </select>
        </div>
      </div>

      {/* Chart Section - Maximized */}
      <div 
        className="flex-1 bg-white m-1 rounded shadow p-2 relative overflow-hidden"
        onClick={(e) => {
          // Close pinned tooltip when clicking on empty space
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.chart-container')) {
            closePinnedTooltip();
          }
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 text-sm">Loading...</p>
            </div>
          </div>
        )}

        {/* Pinned Tooltip Modal */}
        {pinnedAgents && pinnedPosition && (() => {
          // Calculate position to keep tooltip within viewport
          const tooltipWidth = 400;
          const tooltipMaxHeight = window.innerHeight * 0.8; // 80vh
          const padding = 10; // padding from edges
          
          let left = pinnedPosition.x;
          let top = pinnedPosition.y;
          
          // Adjust horizontal position if going off right edge
          if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
          }
          // Ensure not off left edge
          if (left < padding) {
            left = padding;
          }
          
          // Adjust vertical position if going off bottom edge
          if (top + tooltipMaxHeight > window.innerHeight - padding) {
            top = window.innerHeight - tooltipMaxHeight - padding;
          }
          // Ensure not off top edge
          if (top < padding) {
            top = padding;
          }
          
          return (
            <div 
              ref={pinnedTooltipRef}
              className="fixed bg-white p-4 rounded-lg shadow-2xl border-2 border-blue-500 max-h-[80vh] overflow-y-auto z-50"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                maxWidth: '400px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close button */}
            <button
              onClick={closePinnedTooltip}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold text-lg"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-3 pb-2 border-b border-gray-200 pr-6">
              <p className="text-sm font-bold text-blue-600">
                {pinnedAgents.length} Agent{pinnedAgents.length > 1 ? 's' : ''} at this location
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Properties: {pinnedAgents[0]?.noOfInventories || 0}, Enquiries: {pinnedAgents[0]?.noOfEnquiries || 0}
              </p>
            </div>

            {/* Agent List */}
            <div className="space-y-3">
              {pinnedAgents.map((agent: IAgent, idx: number) => (
                <div 
                  key={agent.cpId || idx} 
                  className={`pb-3 ${idx !== pinnedAgents.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <p className="font-bold text-gray-900 text-sm mb-1">
                    {agent.name || 'Unknown'}
                  </p>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p><span className="font-semibold">CP ID:</span> {agent.cpId}</p>
                    <p><span className="font-semibold">KAM:</span> {agent.kamName || 'N/A'}</p>
                    <p>
                      <span className="font-semibold">Type:</span>{' '}
                      <span className="capitalize font-medium">{agent.userType || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        {/* Axis Range Controls - Top Right Floating */}
        <div className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm border border-gray-300 rounded shadow-lg p-2 text-xs space-y-1.5">
          {/* X-Axis Controls */}
          <div>
            <label className="font-semibold text-gray-700 mb-0.5 block text-[10px]">X (Enq)</label>
            <div className="flex gap-1">
              <input
                type="number"
                placeholder="Min"
                value={xMin}
                onChange={(e) => setXMin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyValues();
                  }
                }}
                className="w-14 px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={xMax}
                onChange={(e) => setXMax(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyValues();
                  }
                }}
                className="w-14 px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Y-Axis Controls */}
          <div>
            <label className="font-semibold text-gray-700 mb-0.5 block text-[10px]">Y (Prop)</label>
            <div className="flex gap-1">
              <input
                type="number"
                placeholder="Min"
                value={yMin}
                onChange={(e) => setYMin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyValues();
                  }
                }}
                className="w-14 px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={yMax}
                onChange={(e) => setYMax(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyValues();
                  }
                }}
                className="w-14 px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
          
          {/* Agent Count Display */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-[10px] font-semibold text-gray-700">
              Agents in Range:
            </p>
            <p className="text-sm font-bold text-blue-600">
              {visibleAgentsCount}
            </p>
          </div>
        </div>

        {/* Chart Container */}
        <div 
          className="w-full h-full"
          onMouseMove={(e) => {
            // Clear suppression if mouse has moved away from the original position
            if (suppressedCoordinates && lastMousePositionRef.current) {
              const dx = Math.abs(e.clientX - lastMousePositionRef.current.x);
              const dy = Math.abs(e.clientY - lastMousePositionRef.current.y);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // If moved more than 30 pixels, clear suppression
              if (distance > 30) {
                setSuppressHoverTooltip(false);
                setSuppressedCoordinates(null);
                lastMousePositionRef.current = null;
                if (suppressTimeoutRef.current) {
                  clearTimeout(suppressTimeoutRef.current);
                }
              }
            }
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 10,
              right: 10,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="noOfEnquiries"
              name="Enquiries"
              domain={[axisDomain.xMin, axisDomain.xMax]}
              allowDataOverflow
              tickCount={8}
              label={{
                value: 'Enquiries',
                position: 'insideBottom',
                offset: -15,
                style: { fontSize: '12px', fontWeight: '600' },
              }}
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="noOfInventories"
              name="Properties"
              domain={[axisDomain.yMin, axisDomain.yMax]}
              allowDataOverflow
              tickCount={8}
              label={{
                value: 'Properties',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fontWeight: '600' },
              }}
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            {/* Premium agents - Green (dark border when overlapping) */}
            {chartData.premium.length > 0 && (
              <Scatter
                name="Premium"
                data={chartData.premium}
                fill="#16a34a"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const overlapCount = payload.overlapCount || 1;
                  const size = overlapCount > 1 ? 6 : 4;
                  const strokeWidth = overlapCount > 1 ? 2 : 0;
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={size} 
                      fill="#16a34a" 
                      opacity={1}
                      stroke={overlapCount > 1 ? "#14532d" : "none"}
                      strokeWidth={strokeWidth}
                      style={{ cursor: 'pointer' }}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setPinnedAgents(payload.allAgents || [payload]);
                        setPinnedPosition({ x: e.clientX, y: e.clientY });
                      }}
                    />
                  );
                }}
              />
            )}
            
            {/* Trial agents - Orange (dark border when overlapping) */}
            {chartData.trial.length > 0 && (
              <Scatter
                name="Trial"
                data={chartData.trial}
                fill="#f97316"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const overlapCount = payload.overlapCount || 1;
                  const size = overlapCount > 1 ? 6 : 4;
                  const strokeWidth = overlapCount > 1 ? 2 : 0;
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={size} 
                      fill="#f97316" 
                      opacity={1}
                      stroke={overlapCount > 1 ? "#9a3412" : "none"}
                      strokeWidth={strokeWidth}
                      style={{ cursor: 'pointer' }}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setPinnedAgents(payload.allAgents || [payload]);
                        setPinnedPosition({ x: e.clientX, y: e.clientY });
                      }}
                    />
                  );
                }}
              />
            )}
            
            {/* Basic agents - Gray (dark border when overlapping) */}
            {chartData.basic.length > 0 && (
              <Scatter
                name="Basic"
                data={chartData.basic}
                fill="#9ca3af"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const overlapCount = payload.overlapCount || 1;
                  const size = overlapCount > 1 ? 6 : 4;
                  const strokeWidth = overlapCount > 1 ? 2 : 0;
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={size} 
                      fill="#9ca3af" 
                      opacity={1}
                      stroke={overlapCount > 1 ? "#374151" : "none"}
                      strokeWidth={strokeWidth}
                      style={{ cursor: 'pointer' }}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setPinnedAgents(payload.allAgents || [payload]);
                        setPinnedPosition({ x: e.clientX, y: e.clientY });
                      }}
                    />
                  );
                }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AgentVisualizer;
