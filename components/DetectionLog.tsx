import React, { useMemo } from 'react';
import { type DetectionEvent } from '../types';

interface DetectionLogProps {
  detections: DetectionEvent[];
}

// Helper function to escape special regex characters
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const CONTEXT_CHARS_WINDOW = 80;

/**
 * Renders a snippet of the context around the detected word, with the full context available on hover.
 */
const ContextSnippet: React.FC<{ detection: DetectionEvent }> = ({ detection }) => {
  const { context, word } = detection;

  // Find the last occurrence of the word, as detections are based on the latest transcript.
  const matchIndex = context.toLowerCase().lastIndexOf(word.toLowerCase());

  if (matchIndex === -1) {
    // Fallback if word isn't found (should be rare), render full context with highlighting.
    return (
      <p className="text-gray-300 leading-relaxed" title={context}>
        {context.split(new RegExp(`(${escapeRegExp(word)})`, 'gi')).map((part, index) =>
          part.toLowerCase() === word.toLowerCase() ? (
            <strong key={index} className="text-amber-300 font-medium">
              {part}
            </strong>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </p>
    );
  }

  const startIndex = Math.max(0, matchIndex - CONTEXT_CHARS_WINDOW);
  const endIndex = Math.min(context.length, matchIndex + word.length + CONTEXT_CHARS_WINDOW);

  const snippet = context.substring(startIndex, endIndex);

  const leadingEllipsis = startIndex > 0 ? '... ' : '';
  const trailingEllipsis = endIndex < context.length ? ' ...' : '';

  return (
    <p className="text-gray-300 leading-relaxed" title={context}>
      {leadingEllipsis}
      {snippet.split(new RegExp(`(${escapeRegExp(word)})`, 'gi')).map((part, index) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <strong key={index} className="text-amber-300 font-medium">
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
      {trailingEllipsis}
    </p>
  );
};


const DetectionLog: React.FC<DetectionLogProps> = ({ detections }) => {
  const lastDetectionId = detections.length > 0 ? detections[detections.length - 1].id : null;

  // Augment detections with time difference from the previous mention of the same keyword
  const detectionsWithTimeDiff = useMemo(() => {
    return detections.map((detection, index) => {
      let previousDetectionTimestamp: number | null = null;
      // Search backwards from the current detection to find the last one with the same keyword
      for (let i = index - 1; i >= 0; i--) {
        if (detections[i].keyword === detection.keyword) {
          previousDetectionTimestamp = detections[i].sessionTimestamp;
          break; // Found the most recent previous one, stop searching
        }
      }

      const timeDiff = previousDetectionTimestamp !== null
        ? detection.sessionTimestamp - previousDetectionTimestamp
        : null;

      return { ...detection, timeDiff };
    });
  }, [detections]);

  const reversedDetections = useMemo(() => [...detectionsWithTimeDiff].reverse(), [detectionsWithTimeDiff]);

  return (
    <div className="bg-[#1C1C1E] border border-gray-800 rounded-lg h-full flex flex-col">
      <h2 className="text-gray-100 font-semibold p-4 border-b border-gray-800">Detection Log & Event Correlation</h2>
      <div className="overflow-y-auto flex-grow p-4 text-sm space-y-2">
        {reversedDetections.map((detection) => (
          <div
            key={detection.id}
            className={`flex items-start gap-3 py-1.5 border-b border-gray-800/50 last:border-b-0 ${detection.id === lastDetectionId ? 'animate-highlight rounded-md' : ''}`}
          >
            <span className="text-gray-500 font-mono whitespace-nowrap pt-0.5">{detection.time}</span>
            <div className="flex items-baseline gap-2 w-40 flex-shrink-0 pt-0.5">
              <span className="text-blue-400 font-medium truncate" title={detection.keyword}>
                [{detection.keyword}]
              </span>
              {detection.timeDiff !== null && (
                <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                  (+{detection.timeDiff.toFixed(1)}s)
                </span>
              )}
            </div>
            <ContextSnippet detection={detection} />
          </div>
        ))}
        {detections.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-600">
                Awaiting keyword detections...
            </div>
        )}
      </div>
    </div>
  );
};

export default DetectionLog;