import React from 'react';

const buyOrders = [
    { price: 95, amount: 150.52 },
    { price: 94, amount: 300.00 },
    { price: 93, amount: 50.10 },
    { price: 92, amount: 125.00 },
    { price: 91, amount: 200.75 },
    { price: 90, amount: 180.20 },
];

const sellOrders = [
    { price: 96, amount: 200.00 },
    { price: 97, amount: 120.30 },
    { price: 98, amount: 80.00 },
    { price: 99, amount: 150.00 },
    { price: 100, amount: 50.00 },
    { price: 101, amount: 25.50 },
];

const OrderBook: React.FC = () => {
    const maxAmount = Math.max(
        ...buyOrders.map(o => o.amount),
        ...sellOrders.map(o => o.amount)
    );

    return (
        <div className="bg-[#1C1C1E] p-4 rounded-lg flex flex-col text-sm">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-white">Chance</h3>
                 <div className="flex gap-2 text-gray-400">
                    <button className="hover:text-white">🔍</button>
                    <button className="hover:text-white">↕️</button>
                 </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <div className="flex justify-between text-gray-400 mb-2 px-1">
                        <span>Price (¢)</span>
                        <span>Amount ($)</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        {buyOrders.map(order => (
                            <div key={`buy-${order.price}`} className="relative flex justify-between items-center p-1 rounded-sm overflow-hidden h-6">
                                <div
                                    className="absolute top-0 left-0 h-full bg-green-500 opacity-10"
                                    style={{ width: `${(order.amount / maxAmount) * 100}%` }}
                                ></div>
                                <span className="z-10 text-green-400 font-mono">{order.price}</span>
                                <span className="z-10 text-white font-mono">{order.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-gray-400 mb-2 px-1">
                        <span>Price (¢)</span>
                        <span>Amount ($)</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        {sellOrders.map(order => (
                            <div key={`sell-${order.price}`} className="relative flex justify-between items-center p-1 rounded-sm overflow-hidden h-6">
                                <div
                                    className="absolute top-0 left-0 h-full bg-red-500 opacity-10"
                                    style={{ width: `${(order.amount / maxAmount) * 100}%` }}
                                ></div>
                                <span className="z-10 text-red-400 font-mono">{order.price}</span>
                                <span className="z-10 text-white font-mono">{order.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderBook;
