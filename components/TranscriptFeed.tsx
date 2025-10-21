import React from 'react';
import { type TranscriptEntry } from '../types';

interface TranscriptFeedProps {
  entries: TranscriptEntry[];
}

const TranscriptFeed: React.FC<TranscriptFeedProps> = ({ entries }) => {
  return (
    <div className="bg-[#1C1C1E] border border-gray-800 rounded-lg h-full flex flex-col">
      <h2 className="text-gray-100 font-semibold p-4 border-b border-gray-800">Live Transcript Feed</h2>
      <div className="overflow-y-auto flex-grow p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="w-1/2 pb-2 font-medium">Transcript/Context</th>
              <th className="w-1/6 pb-2 font-medium">Speaker</th>
              <th className="w-1/4 pb-2 font-medium">Time</th>
              <th className="w-1/12 pb-2 font-medium text-center">Alert</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors duration-200 ${entry.isAlert ? 'animate-highlight' : ''}`}
              >
                <td className={`py-2 ${entry.isAlert ? 'text-amber-300 font-medium' : 'text-gray-300'}`}>
                  {entry.word}
                </td>
                <td className="text-gray-400">{entry.speaker}</td>
                <td className="text-gray-500 font-mono">{entry.time}</td>
                <td className="text-center">{entry.isAlert && <span className="text-amber-400 animate-pulse">●</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TranscriptFeed;