
import React from 'react';

interface FooterProps {
  sessionTime: number;
  wordCount: number;
  mentionCount: number;
  speaker: string;
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-gray-500 uppercase text-xs">{label}</span>
    <span className="text-gray-200 font-semibold font-mono">{value}</span>
  </div>
);

const Footer: React.FC<FooterProps> = ({ sessionTime, wordCount, mentionCount, speaker }) => {
  return (
    <footer className="bg-[#1C1C1E] p-3 rounded-lg flex flex-wrap justify-between items-center text-sm border border-gray-800">
      <StatItem label="Session" value={formatTime(sessionTime)} />
      <StatItem label="Words" value={wordCount} />
      <StatItem label="Mentions" value={mentionCount} />
      <StatItem label="Speaker" value={speaker} />
    </footer>
  );
};

export default Footer;