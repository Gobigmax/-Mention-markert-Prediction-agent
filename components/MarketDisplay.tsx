
import React from 'react';
import { type MarketData } from '../types';

interface MarketDisplayProps {
  marketData: MarketData;
}

const MarketDisplay: React.FC<MarketDisplayProps> = ({ marketData }) => {
  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <h3 className="text-gray-200 mb-2 text-center text-lg">{marketData.marketTitle}</h3>
      <p className="text-gray-400 mb-4 text-sm text-center">The following outcomes have been loaded into the keyword list.</p>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {marketData.positions.map((position, index) => (
          <div
            key={index}
            className="w-full text-left p-2 border bg-gray-800/50 text-gray-300 border-gray-700 text-sm rounded-md"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{position.title}</span>
              <a 
                href={position.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs hover:underline text-blue-400"
                aria-label={`View source for ${position.title}`}
              >
                [source]
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketDisplay;