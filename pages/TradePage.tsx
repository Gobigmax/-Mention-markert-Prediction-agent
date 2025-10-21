import React, { useState } from 'react';
import MarketCard from '../components/trade/MarketCard';
import OrderTicket from '../components/trade/OrderTicket';
import OrderBook from '../components/trade/OrderBook';
import { type MarketOutcome } from '../types';

const defaultMarket: MarketOutcome = {
    name: 'Balance of Risk',
    price: 95,
    trend: 'up',
    trendValue: 2,
    yesPrice: 96,
    noPrice: 5,
};

const TradePage: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketOutcome>(defaultMarket);

  return (
    <main className="flex-grow flex flex-col md:flex-row gap-4 my-4 overflow-hidden text-white">
        <div className="w-full md:w-2/3 flex flex-col gap-4 overflow-y-auto pr-2">
            <MarketCard onSelectMarket={setSelectedMarket} selectedMarketName={selectedMarket.name}/>
            <OrderBook />
        </div>
        <div className="w-full md:w-1/3">
            <OrderTicket selectedMarket={selectedMarket} />
        </div>
    </main>
  );
};

export default TradePage;