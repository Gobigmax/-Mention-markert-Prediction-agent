
export interface TranscriptEntry {
  id: string;
  word: string;
  speaker: string;
  time: string;
  isAlert: boolean;
}

export interface Keyword {
  keyword: string;
  aliases?: string[];
  count: number;
  target: number;
  isMentioned?: boolean;
}

export interface MarketPosition {
    title: string;
    url: string;
    keywords: string[];
}

export interface MarketData {
    marketTitle: string;
    positions: MarketPosition[];
}

export interface MarketOutcome {
    name: string;
    price: number;
    trend: 'up' | 'down' | 'none';
    trendValue: number;
    yesPrice: number;
    noPrice: number;
}

export interface DetectionEvent {
  id:string;
  keyword: string;
  word: string;
  speaker: string;
  time: string;
  sessionTimestamp: number;
  context: string;
}

/**
 * Represents a media blob for the Google GenAI API,
 * consisting of Base64-encoded data and a MIME type.
 * This is defined locally to resolve an import issue with the SDK.
 */
export interface Blob {
  data: string;
  mimeType: string;
}