import React from 'react';
import { type MarketOutcome } from '../../types';
import GraphPlaceholder from './GraphPlaceholder';

interface MarketCardProps {
    onSelectMarket: (market: MarketOutcome) => void;
    selectedMarketName: string;
}

const contractsData: MarketOutcome[] = [
    { name: 'Balance of Risk', price: 95, trend: 'up', trendValue: 2, yesPrice: 96, noPrice: 5 },
    { name: 'Restrictive', price: 93, trend: 'none', trendValue: 0, yesPrice: 94, noPrice: 7 },
    { name: 'Balance Sheet', price: 91, trend: 'down', trendValue: 1, yesPrice: 92, noPrice: 9 },
    { name: 'Recession', price: 41, trend: 'up', trendValue: 5, yesPrice: 41, noPrice: 62 },
    { name: 'Projection', price: 37, trend: 'down', trendValue: 1, yesPrice: 37, noPrice: 65 },
];

const TrendArrow: React.FC<{ trend: 'up' | 'down' | 'none'; value: number }> = ({ trend, value }) => {
    if (trend === 'none' || value === 0) return null;
    const isUp = trend === 'up';
    return (
        <span className={`flex items-center text-xs ml-2 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '▲' : '▼'}
            <span className="ml-1">{value}</span>
        </span>
    );
};

const MarketCard: React.FC<MarketCardProps> = ({ onSelectMarket, selectedMarketName }) => {
    return (
        <div className="bg-[#1C1C1E] p-4 rounded-lg flex flex-col">
            <div className="flex items-center mb-2">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAReSURBVHhe7Zx/T9tVFMf5T7o2bdu2bXPa1rENo1jbto3tGA2j+BuIsagYiSAViCgMgiACEiQiosACxRBEGCIoKigqKIpgURQVFAkYJ4aZgBGUTGf8oUvVfq7b3XvP63O/d87JvTs19/u+PX/fnXPuOScQikQi0SSwTgdg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1G-gD/1/P6z/A+gVz2wAAAABJRU5ErkJggg==" alt="Jerome Powell" className="w-12 h-12 rounded-full" />
                <h2 className="text-2xl font-semibold ml-4 text-white">What Will Powell Say During His October Press Conference?</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">Begins in 12 days ⋅ Oct 29, 2:00pm EDT</p>
            <div className="border-t border-gray-700 pt-4 mb-4">
                <div className="flex items-center gap-6 text-sm text-gray-300">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Probability<strong className="text-white ml-1">60%</strong></span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Tariff Inflation<strong className="text-white ml-1">48%</strong></span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>Recession<strong className="text-white ml-1">41%</strong></span>
                </div>
            </div>

            <GraphPlaceholder />

            <div className="flex-grow mt-4 border-t border-gray-700 pt-4">
                {contractsData.map(market => (
                     <div key={market.name} className={`flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0 ${selectedMarketName === market.name ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}>
                        <span className="text-gray-300 w-1/3">{market.name}</span>
                        <div className="flex items-center font-semibold text-lg text-white">
                            <span>{market.price}%</span>
                            <TrendArrow trend={market.trend} value={market.trendValue} />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onSelectMarket(market)}
                                className="bg-[#2E5C99] hover:bg-[#3B82F6] text-white font-bold py-2 px-4 rounded-md text-sm transition-colors"
                            >
                                Yes {market.yesPrice}¢
                            </button>
                            <button
                                onClick={() => onSelectMarket(market)}
                                className="bg-[#4D3C6E] hover:bg-[#6D28D9] text-white font-bold py-2 px-4 rounded-md text-sm transition-colors"
                            >
                                No {market.noPrice}¢
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketCard;