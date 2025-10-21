import React, { useMemo, useState, useRef, useEffect } from 'react';
import { type DetectionEvent, type Keyword } from '../types';

interface DetectionChartProps {
  detections: DetectionEvent[];
  sessionTime: number;
  keywords: Keyword[];
}

const PROXIMITY_THRESHOLD_S = 5; // Seconds
const TENSION_LINE_THRESHOLD = 5; // Interactions to form a tension line

// Fix: Defined the LiveConnector interface to properly type the objects representing proximity events.
interface LiveConnector {
  from: DetectionEvent;
  to: DetectionEvent;
  id: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const DetectionChart: React.FC<DetectionChartProps> = ({ detections, sessionTime, keywords }) => {
  const [hiddenKeywords, setHiddenKeywords] = useState<Set<string>>(new Set());
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    keyword: string;
    count: number;
    time: number;
    context: string;
    against?: string | null;
  } | null>(null);
  // Fix: Typed the liveConnectors state with the LiveConnector interface to resolve errors.
  const [liveConnectors, setLiveConnectors] = useState<Map<string, LiveConnector>>(new Map());
  const svgRef = useRef<SVGSVGElement>(null);

  const chartData = useMemo(() => {
    const detectedKeywordNames = new Set(detections.map(d => d.keyword));
    if (detectedKeywordNames.size === 0) {
      return { dataByKeyword: new Map(), actualPointsByKeyword: new Map(), maxCount: 5, keywordColors: new Map(), allDetectedKeywords: [], dominantKeyword: null, proximityEvents: [], tensionLines: [] };
    }

    const allDetectedKeywords = keywords.filter(kw => detectedKeywordNames.has(kw.keyword));
    const dataByKeyword = new Map<string, { x: number; y: number }[]>();
    const actualPointsByKeyword = new Map<string, { x: number; y: number, context: string }[]>();
    const keywordColors = new Map<string, string>();
    const COLORS = ['#34D399', '#60A5FA', '#F87171', '#FBBF24', '#A78BFA', '#EC4899', '#2DD4BF', '#F472B6'];

    allDetectedKeywords.forEach((kw) => {
      const originalIndex = keywords.findIndex(k => k.keyword === kw.keyword);
      keywordColors.set(kw.keyword, COLORS[originalIndex % COLORS.length]);
      dataByKeyword.set(kw.keyword, [{ x: 0, y: 0 }]);
      actualPointsByKeyword.set(kw.keyword, []);
    });

    const sortedDetections = [...detections].sort((a, b) => a.sessionTimestamp - b.sessionTimestamp);
    const counts: { [key: string]: number } = {};
    allDetectedKeywords.forEach(kw => { counts[kw.keyword] = 0; });

    sortedDetections.forEach(detection => {
      const keyword = detection.keyword;
      if (dataByKeyword.has(keyword)) {
        counts[keyword]++;
        const series = dataByKeyword.get(keyword)!;
        const actualPoints = actualPointsByKeyword.get(keyword)!;
        const lastPoint = series[series.length - 1];
        series.push({ x: detection.sessionTimestamp, y: lastPoint.y });
        series.push({ x: detection.sessionTimestamp, y: counts[keyword] });
        actualPoints.push({ x: detection.sessionTimestamp, y: counts[keyword], context: detection.context });
      }
    });

    let dominantKeyword: string | null = null;
    let maxMentions = 0;
    actualPointsByKeyword.forEach((points, keyword) => {
        const count = points.length > 0 ? points[points.length-1].y : 0;
        if (count > maxMentions) {
            maxMentions = count;
            dominantKeyword = keyword;
        } else if (count === maxMentions && count > 0) {
            dominantKeyword = null; // Tie, no dominance
        }
    });

    const proximityEvents: {from: DetectionEvent, to: DetectionEvent}[] = [];
    const correlationCounts = new Map<string, number>();

    for (let i = 1; i < sortedDetections.length; i++) {
        const current = sortedDetections[i];
        const prev = sortedDetections[i-1];
        if (current.keyword !== prev.keyword && 
            Math.abs(current.sessionTimestamp - prev.sessionTimestamp) <= PROXIMITY_THRESHOLD_S) {
            proximityEvents.push({from: prev, to: current});
            const key = [prev.keyword, current.keyword].sort().join('-');
            const currentCount = correlationCounts.get(key) || 0;
            correlationCounts.set(key, currentCount + 1);
        }
    }
    
    const tensionLines: {keyword1: string, keyword2: string}[] = [];
    correlationCounts.forEach((count, key) => {
        if (count >= TENSION_LINE_THRESHOLD) {
            const [keyword1, keyword2] = key.split('-');
            tensionLines.push({keyword1, keyword2});
        }
    });
    
    let maxCount = Math.max(...Object.values(counts), 0);
    maxCount = Math.max(5, Math.ceil(maxCount / 5) * 5);
    
    return { dataByKeyword, actualPointsByKeyword, maxCount, keywordColors, allDetectedKeywords, dominantKeyword, proximityEvents, tensionLines };
  }, [detections, keywords]);

  useEffect(() => {
    if (chartData.proximityEvents.length === 0) return;
    const lastEvent = chartData.proximityEvents[chartData.proximityEvents.length - 1];
    const key = `${lastEvent.from.id}-${lastEvent.to.id}`;

    if (!liveConnectors.has(key)) {
      setLiveConnectors(prev => new Map(prev).set(key, { ...lastEvent, id: key }));
      setTimeout(() => {
        setLiveConnectors(prev => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
      }, 1500);
    }
  }, [chartData.proximityEvents, liveConnectors]);

  const { dataByKeyword, actualPointsByKeyword, maxCount, keywordColors, allDetectedKeywords, dominantKeyword, tensionLines } = chartData;

  const PADDING = { top: 10, right: 20, bottom: 45, left: 30 };
  const SVG_WIDTH = 500;
  const SVG_HEIGHT = 200;
  const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
  const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const maxTime = sessionTime > 1 ? sessionTime : 60;
  const xScale = (x: number) => PADDING.left + (x / maxTime) * CHART_WIDTH;
  const yScale = (y: number) => PADDING.top + CHART_HEIGHT - (y / maxCount) * CHART_HEIGHT;

  const yAxisLabels = Array.from({ length: 6 }, (_, i) => ({ value: (maxCount / 5) * i, y: yScale((maxCount / 5) * i) }));
  const xAxisLabels = Array.from({ length: 5 }, (_, i) => ({ value: formatTime((maxTime / 4) * i), x: xScale((maxTime / 4) * i) }));

  const handleToggleKeywordVisibility = (keyword: string) => {
    setHiddenKeywords(prev => {
      const newSet = new Set(prev);
      newSet.has(keyword) ? newSet.delete(keyword) : newSet.add(keyword);
      return newSet;
    });
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || actualPointsByKeyword.size === 0) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (SVG_WIDTH / rect.width);
    const mouseY = (event.clientY - rect.top) * (SVG_HEIGHT / rect.height);

    let closestPointData: any = null;
    let minDistance = 25;

    actualPointsByKeyword.forEach((points, keyword) => {
      if (hiddenKeywords.has(keyword)) return;
      points.forEach(point => {
        const pointX = xScale(point.x);
        const pointY = yScale(point.y);
        const distance = Math.sqrt(Math.pow(pointX - mouseX, 2) + Math.pow(pointY - mouseY, 2));

        if (distance < minDistance) {
          minDistance = distance;
          closestPointData = { x: pointX, y: pointY, keyword, count: point.y, time: point.x, context: point.context };
        }
      });
    });

    if (closestPointData) {
      const thisDetections = detections.filter(d => d.keyword === closestPointData.keyword);
      const thisDetection = thisDetections[closestPointData.count - 1];
      let againstInfo: string | null = null;
      if (thisDetection) {
        let nearestAgainst: DetectionEvent | null = null;
        let minTimeDiff = Infinity;
        detections.forEach(d => {
          if (d.keyword !== thisDetection.keyword) {
            const timeDiff = Math.abs(d.sessionTimestamp - thisDetection.sessionTimestamp);
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              nearestAgainst = d;
            }
          }
        });
        if (nearestAgainst && minTimeDiff <= 10) {
          const diff = nearestAgainst.sessionTimestamp - thisDetection.sessionTimestamp;
          againstInfo = `${nearestAgainst.keyword} (${diff > 0 ? '+' : ''}${diff.toFixed(1)}s)`;
        }
      }
      setTooltip({ ...closestPointData, against: againstInfo });
      setHoveredKeyword(closestPointData.keyword);
    } else {
      setTooltip(null);
      setHoveredKeyword(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredKeyword(null);
  };

  return (
    <div className="bg-[#1C1C1E] border border-gray-800 rounded-lg h-full flex flex-col">
      <h2 className="text-gray-100 font-semibold p-4 border-b border-gray-800">Dynamic Mention Correlation Graph</h2>
      <div className="flex-grow p-4 flex flex-col items-center justify-center">
        {detections.length === 0 ? (
          <div className="text-gray-600">Awaiting detections to build graph...</div>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <svg ref={svgRef} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {yAxisLabels.map(l => <g key={`y-${l.value}`}><line x1={PADDING.left} y1={l.y} x2={PADDING.left + CHART_WIDTH} y2={l.y} stroke="#374151" strokeWidth="0.5" /><text x={PADDING.left - 8} y={l.y + 3} fill="#9CA3AF" fontSize="10" textAnchor="end">{l.value}</text></g>)}
              {xAxisLabels.map(l => <text key={`x-${l.value}`} x={l.x} y={SVG_HEIGHT - PADDING.bottom + 15} fill="#9CA3AF" fontSize="10" textAnchor="middle">{l.value}</text>)}
              <text x={SVG_WIDTH/2} y={SVG_HEIGHT - 5} fill="#9CA3AF" fontSize="12" textAnchor="middle">Time</text>
              <text x={-(PADDING.top + CHART_HEIGHT/2)} y={12} transform="rotate(-90)" fill="#9CA3AF" fontSize="12" textAnchor="middle">Mentions</text>
              
              {tensionLines.map(({ keyword1, keyword2 }) => {
                if (hiddenKeywords.has(keyword1) || hiddenKeywords.has(keyword2)) return null;
                const points1 = actualPointsByKeyword.get(keyword1);
                const points2 = actualPointsByKeyword.get(keyword2);
                if (!points1?.length || !points2?.length) return null;
                const lastPoint1 = points1[points1.length - 1];
                const lastPoint2 = points2[points2.length - 1];
                return <line key={`${keyword1}-${keyword2}`} x1={xScale(lastPoint1.x)} y1={yScale(lastPoint1.y)} x2={xScale(lastPoint2.x)} y2={yScale(lastPoint2.y)} stroke="rgba(156, 163, 175, 0.3)" strokeWidth="2" strokeDasharray="3 3" />;
              })}

              {dominantKeyword && !hiddenKeywords.has(dominantKeyword) && dataByKeyword.has(dominantKeyword) && (
                <polyline fill="none" stroke={keywordColors.get(dominantKeyword)} strokeWidth="8" points={dataByKeyword.get(dominantKeyword)!.map(p => `${xScale(p.x)},${yScale(p.y)}`).join(' ')} style={{ filter: 'url(#glow)', opacity: 0.7, mixBlendMode: 'screen' }} />
              )}

              {Array.from(dataByKeyword.entries()).map(([keyword, data]) => {
                if (hiddenKeywords.has(keyword)) return null;
                const color = keywordColors.get(keyword);
                const isHovered = hoveredKeyword === keyword;
                const isDimmed = hoveredKeyword !== null && !isHovered;
                const actualPoints = actualPointsByKeyword.get(keyword) || [];
                return (
                  <g key={keyword} style={{ opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.2s' }}>
                    <polyline fill="none" stroke={color} strokeWidth={isHovered ? 2.5 : 1.5} points={data.map(p => `${xScale(p.x)},${yScale(p.y)}`).join(' ')} style={{ transition: 'stroke-width 0.2s' }}/>
                    {actualPoints.map((p, i) => <circle key={`${keyword}-${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r={isHovered ? 4 : 2} fill={color} stroke="#1C1C1E" strokeWidth="1" style={{ transition: 'r 0.2s' }} />)}
                  </g>
                );
              })}

              {/* FIX: Explicitly type 'c' as LiveConnector to fix TypeScript errors. */}
              {Array.from(liveConnectors.values()).map((c: LiveConnector) => {
                const fromDetections = detections.filter(d => d.keyword === c.from.keyword && d.sessionTimestamp <= c.from.sessionTimestamp);
                const toDetections = detections.filter(d => d.keyword === c.to.keyword && d.sessionTimestamp <= c.to.sessionTimestamp);
                if (fromDetections.length === 0 || toDetections.length === 0) return null;
                return <line key={c.id} x1={xScale(c.from.sessionTimestamp)} y1={yScale(fromDetections.length)} x2={xScale(c.to.sessionTimestamp)} y2={yScale(toDetections.length)} stroke="#9CA3AF" strokeWidth="1.5" className="animate-connector" />;
              })}
            </svg>
            {tooltip && (
              <div className="absolute bg-gray-900 text-white text-xs p-2 rounded-md border border-gray-700 pointer-events-none shadow-lg z-10" style={{ top: 0, left: 0, transform: `translate(${tooltip.x}px, ${tooltip.y}px) translate(-50%, -120%)` }}>
                <div className="font-bold" style={{ color: keywordColors.get(tooltip.keyword) }}>{tooltip.keyword}</div>
                <div>Count: <span className="font-semibold">{tooltip.count}</span></div>
                <div>Time: <span className="font-semibold">{formatTime(tooltip.time)}</span></div>
                {tooltip.against && <div>Against: <span className="font-semibold">{tooltip.against}</span></div>}
                <div className="mt-1 pt-1 border-t border-gray-700 text-gray-400 max-w-xs truncate">"{tooltip.context}"</div>
              </div>
            )}
            <div className="w-full mt-4 px-2 overflow-x-auto">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm justify-center">
                {allDetectedKeywords.map(kw => (
                  <div key={kw.keyword} className="flex items-center cursor-pointer transition-opacity" style={{ opacity: hoveredKeyword === null || hoveredKeyword === kw.keyword ? 1 : 0.5 }} onMouseEnter={() => setHoveredKeyword(kw.keyword)} onMouseLeave={() => setHoveredKeyword(null)} onClick={() => handleToggleKeywordVisibility(kw.keyword)}>
                    <div className="w-3 h-3 mr-2 rounded-sm" style={{ backgroundColor: hiddenKeywords.has(kw.keyword) ? '#4B5563' : keywordColors.get(kw.keyword) }}></div>
                    <span className={hiddenKeywords.has(kw.keyword) ? "text-gray-600 line-through" : "text-gray-300"}>{kw.keyword}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionChart;
