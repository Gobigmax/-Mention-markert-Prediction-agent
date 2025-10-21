import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  onStop: () => void;
  onOpenOcr: () => void;
  currentPage: 'recognition' | 'trade';
  onSwapView: () => void;
}

const Header: React.FC<HeaderProps> = ({ isConnected, onStop, onOpenOcr, currentPage, onSwapView }) => {
  return (
    <header className="bg-[#1C1C1E] p-3 rounded-lg flex justify-between items-center text-gray-300 border border-gray-800">
      <h1 className="text-lg font-semibold text-gray-100 hidden sm:block">Prediction Mention Control</h1>
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={onSwapView}
          className="bg-gray-700 text-gray-200 font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-200"
          aria-label="Swap View (Ctrl+V)"
        >
          {currentPage === 'recognition' ? 'Trade View' : 'Monitor View'} <span className="text-gray-400 text-xs">(Ctrl+V)</span>
        </button>
        {currentPage === 'recognition' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        )}
        <button
          onClick={onOpenOcr}
          className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-500 transition-colors duration-200"
          aria-label="Open OCR Tool (Ctrl+O)"
        >
          OCR <span className="text-purple-200 text-xs">(Ctrl+O)</span>
        </button>
        {isConnected && currentPage === 'recognition' && (
          <button 
            onClick={onStop} 
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-500 transition-colors duration-200"
            aria-label="Stop transcription (Ctrl+S)"
          >
            Stop <span className="text-red-200 text-xs">(Ctrl+S)</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;