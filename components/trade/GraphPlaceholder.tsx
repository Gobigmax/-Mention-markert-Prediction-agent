import React from 'react';

const GraphPlaceholder: React.FC = () => {
    return (
        <div className="my-4">
            <div className="relative h-48 bg-black p-2 pl-8">
                {/* Y-Axis Labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-gray-500 text-xs py-1">
                    <span>75%</span>
                    <span>60%</span>
                    <span>45%</span>
                    <span>30%</span>
                    <span>15%</span>
                </div>
                {/* Graph Lines using SVG */}
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                    <polyline fill="none" stroke="#10B981" strokeWidth="1.5" points="10,50 50,45 100,55 150,50 200,60 250,55 300,65 350,60 390,70" />
                    <polyline fill="none" stroke="#3B82F6" strokeWidth="1.5" points="10,80 50,85 100,75 150,90 200,80 250,95 300,90 350,105 390,100" />
                    <polyline fill="none" stroke="#FFFFFF" strokeWidth="1.5" points="10,95 50,100 100,110 150,105 200,115 250,100 300,120 350,110 390,125" />
                </svg>
                {/* X-Axis Labels */}
                <div className="absolute left-8 right-0 -bottom-5 flex justify-between text-gray-500 text-xs">
                    <span>18 Sep</span>
                    <span>25 Sep</span>
                    <span>3 Oct</span>
                    <span>11 Oct</span>
                    <span>18 Oct</span>
                </div>
            </div>
            <div className="flex justify-between items-center mt-8 text-gray-400 text-sm">
                <span>$324,874 vol</span>
                <div className="flex gap-4 items-center">
                    <button className="hover:text-white">1D</button>
                    <button className="hover:text-white">1W</button>
                    <button className="hover:text-white">1M</button>
                    <button className="text-white font-bold border-b-2 border-white">ALL</button>
                </div>
            </div>
        </div>
    );
};

export default GraphPlaceholder;