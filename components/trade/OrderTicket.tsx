import React, { useState } from 'react';
import { type MarketOutcome } from '../../types';

interface OrderTicketProps {
    selectedMarket: MarketOutcome;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ selectedMarket }) => {
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [price, setPrice] = useState(selectedMarket.yesPrice);
    const [amount, setAmount] = useState('');

    const cost = price && amount ? (parseFloat(amount) * price / 100).toFixed(2) : '0.00';

    return (
        <div className="bg-[#1C1C1E] p-4 rounded-lg h-full flex flex-col">
            <div className="flex items-center mb-4 pb-4 border-b border-gray-700">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAReSURBVHhe7Zx/T9tVFMf5T7o2bdu2bXPa1rENo1jbto3tGA2j+BuIsagYiSAViCgMgiACEiQiosACxRBEGCIoKigqKIpgURQVFAkYJ4aZgBGUTGf8oUvVfq7b3XvP63O/d87JvTs19/u+PX/fnXPuOScQikQi0SSwTgdg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1Gjg1-gD/1/P6z/A+gVz2wAAAABJRU5ErkJggg==" alt="Jerome Powell" className="w-10 h-10 rounded-full" />
                <div className="ml-4">
                    <h2 className="text-sm font-semibold text-gray-400">What Will Powell Say During His October Press Conference?</h2>
                    <p className="text-white font-bold text-lg">
                        <span className="text-blue-400">Buy Yes</span>
                        <span className="text-gray-300"> · {selectedMarket.name}</span>
                    </p>
                </div>
            </div>

            <div className="flex bg-black rounded-md p-1 my-4">
                <button
                    onClick={() => setTradeType('buy')}
                    className={`w-1/2 py-2 text-center rounded-md text-sm font-bold ${tradeType === 'buy' ? 'bg-[#00D578] text-black' : 'text-gray-300'}`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setTradeType('sell')}
                    className={`w-1/2 py-2 text-center rounded-md text-sm font-bold ${tradeType === 'sell' ? 'bg-gray-600 text-white' : 'text-gray-300'}`}
                >
                    Sell
                </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
                <label htmlFor="price" className="text-gray-400 text-sm">Price</label>
                <div className="flex items-center bg-black rounded-md p-1">
                     <span className="text-white px-2">{price}¢</span>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <label htmlFor="amount" className="text-gray-400 text-sm">Dollars</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="bg-black border border-gray-600 rounded-md w-full p-2 text-white text-right pr-4 pl-8"
                    />
                </div>
            </div>
            
            <div className="text-xs text-green-400 mb-4 text-center">
                Earn 3.75% Interest
            </div>

            <div className="mt-auto">
                <button className="bg-[#3B82F6] hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-md w-full text-center transition-colors">
                    Buy
                </button>
            </div>
        </div>
    );
};

export default OrderTicket;
