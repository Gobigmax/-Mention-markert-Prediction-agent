
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import Header from './components/Header';
import Footer from './components/Footer';
import TranscriptFeed from './components/TranscriptFeed';
import KeywordList from './components/KeywordList';
import MarketDisplay from './components/MarketDisplay';
import OcrModal from './components/OcrModal';
import DetectionLog from './components/DetectionLog';
import DetectionChart from './components/DetectionChart';
import { type TranscriptEntry, type Keyword, type MarketData, type Blob, type DetectionEvent } from './types';
import { INITIAL_KEYWORDS } from './constants';
import TradePage from './pages/TradePage';

// A dictionary mapping common regional/phonetic word variations to a canonical form.
const CANONICAL_WORD_MAP: Record<string, string> = {
  'aluminium': 'aluminum',
  'colour': 'color',
  'flavour': 'flavor',
  'licence': 'license',
  'theatre': 'theater',
  'grey': 'gray',
  'centre': 'center',
  'analyse': 'analyze',
  'organise': 'organize',
  'behaviour': 'behavior',
};

// Gemini function declaration for the word identification tool.
const identifyWordsFunctionDeclaration: FunctionDeclaration = {
  name: 'identify_the_words',
  description: 'Identifies and processes words that have phonetic or regional spelling variations but the same meaning, such as "aluminum" and "aluminium". Call this function when such a word is detected in the speech.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      word: {
        type: Type.STRING,
        description: 'The detected word variation (e.g., "aluminium").',
      },
    },
    required: ['word'],
  },
};

// Encodes raw audio byte array into a Base64 string.
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decodes a Base64 string into a raw audio byte array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer that can be played.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// A helper function to combine multiple Float32Array chunks into one.
const concatenateFloat32Arrays = (arrays: Float32Array[]): Float32Array => {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
};


// Normalizes a word by lowercasing and trimming leading/trailing non-alphanumeric characters.
const normalizeWord = (word: string): string => {
  if (!word) return '';
  // Lowercase and remove leading/trailing punctuation and symbols.
  // Keeps internal hyphens and apostrophes.
  return word.toLowerCase().replace(/^[\W_]+|[\W_]+$/g, '');
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};


const App: React.FC = () => {
  const [page, setPage] = useState<'recognition' | 'trade'>('recognition');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>(INITIAL_KEYWORDS);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [mentionCount, setMentionCount] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState('Not Connected');
  const [marketUrl, setMarketUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [manualKeywords, setManualKeywords] = useState('');
  const [keywordsAreSetByUser, setKeywordsAreSetByUser] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const [sessionStoppedByUser, setSessionStoppedByUser] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [detections, setDetections] = useState<DetectionEvent[]>([]);
  const [chartDetections, setChartDetections] = useState<DetectionEvent[]>([]); // For the chart
  const [apiKeyIsSelected, setApiKeyIsSelected] = useState(false);

  const entryIdCounter = useRef(0);
  const detectionIdCounter = useRef(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const currentInputTranscription = useRef('');
  const fullTranscriptRef = useRef<TranscriptEntry[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentGainRef = useRef(1.0); // Ref for adaptive gain control

  // Refs for adaptive audio buffering
  const audioQueueRef = useRef<Float32Array[]>([]);
  const adaptiveBufferSizeRef = useRef(4096 * 2); // Start with a moderate buffer
  const lastReceiveTimeRef = useRef<number>(0);

  const nextStartTime = useRef(0);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyIsSelected(hasKey);
      } else {
        console.warn('window.aistudio is not available. Assuming API key is set for development.');
        setApiKeyIsSelected(true);
      }
    };
    checkApiKey();
  }, []);
  
  useEffect(() => {
    if (isConnected && sessionStartTime) {
      timerRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected, sessionStartTime]);

  useEffect(() => {
    const importDebounce = setTimeout(() => {
      if(marketUrl) {
        handleImportMarket();
      }
    }, 1000);

    return () => clearTimeout(importDebounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketUrl]);

  const handleSelectApiKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setApiKeyIsSelected(true);
    }
  };

  const handleUpdateKeywords = useCallback((keywordsRaw: string[]) => {
    const newKeywords = keywordsRaw.flatMap(kRaw => {
      const trimmedRaw = kRaw.trim();
      let keyword = trimmedRaw;
      let target = 1;

      const match = trimmedRaw.match(/^(.*?)\s*(?::|\+)(\d+)$|^(.*?)\s*(\d+)\+\s*(?:times)?$|^(\d+)\+\s*(?:times)?\s*(.*?)$|^(.*?)\s*([+]+)$/);
  
      if (match) {
        if (match[1] !== undefined && match[2] !== undefined) {
          keyword = match[1].trim();
          target = parseInt(match[2], 10);
        } else if (match[3] !== undefined && match[4] !== undefined) {
          keyword = match[3].trim();
          target = parseInt(match[4], 10);
        } else if (match[5] !== undefined && match[6] !== undefined) {
          keyword = match[6].trim();
          target = parseInt(match[5], 10);
        } else if (match[7] !== undefined && match[8] !== undefined) {
          keyword = match[7].trim();
          target = match[8].length;
        }
      }
  
      if (isNaN(target) || target < 1) {
        target = 1;
      }
      
      if (!keyword) return [];

      return [{ keyword, count: 0, target }];
    });
    setKeywords(newKeywords);
  }, []);

  const handleDeleteKeyword = (keywordToDelete: string) => {
    setKeywords(prev => prev.filter(k => k.keyword !== keywordToDelete));
  };

  const handleResetKeywordCount = (keywordToReset: string) => {
    setKeywords(prev => prev.map(k => k.keyword === keywordToReset ? { ...k, count: 0 } : k));
  };

  const handleEditKeyword = (originalKeywordName: string, newKeywordRaw: string) => {
    const trimmedRaw = newKeywordRaw.trim();
    if (!trimmedRaw) {
      alert("Keyword cannot be empty.");
      return;
    }

    let newKeywordName = trimmedRaw;
    let newTarget = 1;

    const match = trimmedRaw.match(/^(.*?)\s*(?::|\+)(\d+)$|^(.*?)\s*(\d+)\+\s*(?:times)?$|^(\d+)\+\s*(?:times)?\s*(.*?)$|^(.*?)\s*([+]+)$/);

    if (match) {
      if (match[1] !== undefined && match[2] !== undefined) {
        newKeywordName = match[1].trim();
        newTarget = parseInt(match[2], 10);
      } else if (match[3] !== undefined && match[4] !== undefined) {
        newKeywordName = match[3].trim();
        newTarget = parseInt(match[4], 10);
      } else if (match[5] !== undefined && match[6] !== undefined) {
        newKeywordName = match[6].trim();
        newTarget = parseInt(match[5], 10);
      } else if (match[7] !== undefined && match[8] !== undefined) {
        newKeywordName = match[7].trim();
        newTarget = match[8].length;
      }
    }
    
    if (!newKeywordName) {
      alert("Keyword name cannot be empty.");
      return;
    }
    if (isNaN(newTarget) || newTarget < 1) newTarget = 1;
    
    const newKeyword: Keyword = { keyword: newKeywordName, count: 0, target: newTarget };

    setKeywords(prev => {
        const originalKeyword = prev.find(k => k.keyword === originalKeywordName);
        if (originalKeyword?.aliases) {
            newKeyword.aliases = originalKeyword.aliases;
        }

        const isDuplicate = prev.some(k => 
            k.keyword.toLowerCase() === newKeywordName.toLowerCase() &&
            k.keyword.toLowerCase() !== originalKeywordName.toLowerCase()
        );
        if (isDuplicate) {
          alert(`Keyword "${newKeywordName}" already exists.`);
          return prev;
        }
        return prev.map(k => k.keyword === originalKeywordName ? newKeyword : k);
    });
  };

  const handleImportMarket = useCallback(async () => {
    if (!marketUrl || isImporting) {
      return;
    }
    setIsImporting(true);
    setMarketData(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          marketTitle: { type: Type.STRING, description: "The main title of the prediction market." },
          positions: {
            type: Type.ARRAY,
            description: "A list of the bettable positions or outcomes in the market.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The title of the bettable position." },
                keywords: { 
                  type: Type.ARRAY, 
                  description: "A concise list of 2-4 critical, single, uppercase words that represent the core concept of the bet.",
                  items: { type: Type.STRING } 
                },
              },
              required: ['title', 'keywords'],
            },
          },
        },
        required: ['marketTitle', 'positions'],
      };

      const prompt = `Analyze the content of the prediction market at this URL: ${marketUrl}. Extract the main title of the market and a list of all bettable positions. For each position, provide its title and a list of 2-4 single, uppercase keywords that are essential to that position's outcome.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });

      const jsonText = response.text.trim();
      const parsedData = JSON.parse(jsonText);
      
      if (!parsedData.marketTitle || !parsedData.positions) {
        throw new Error("Parsed data is missing required fields.");
      }

      const newMarketData: MarketData = {
          marketTitle: parsedData.marketTitle,
          positions: parsedData.positions.map((p: any) => ({
              title: p.title,
              url: marketUrl,
              keywords: p.keywords,
          })),
      };

      setMarketData(newMarketData);

      const allKeywords = newMarketData.positions.flatMap(p => p.keywords);
      const uniqueKeywords = [...new Set(allKeywords)];

      if(uniqueKeywords.length > 0) {
        handleUpdateKeywords(uniqueKeywords);
        alert(`${uniqueKeywords.length} keywords have been imported from "${newMarketData.marketTitle}".`);
        setKeywordsAreSetByUser(true);
      } else {
        alert("Could not extract any keywords from the market. Please enter them manually.");
      }

    } catch (error) {
      console.error('Error importing market data:', error);
      if (error instanceof Error && (error.message.includes('Requested entity was not found') || error.message.includes('does not have permission'))) {
          alert('Your API key is invalid or lacks the required permissions. Please select a valid key to continue.');
          setApiKeyIsSelected(false);
      } else {
          alert('Failed to import and parse market data. The URL might be unsupported or the content is not in the expected format. Please try again or enter keywords manually.');
      }
    } finally {
      setIsImporting(false);
    }
  }, [marketUrl, isImporting, handleUpdateKeywords]);

  const handleSetManualKeywords = () => {
    const newKeywords = manualKeywords.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    if (newKeywords.length > 0) {
        handleUpdateKeywords(newKeywords);
        setMarketData(null); 
        setMarketUrl('');
        alert(`${newKeywords.length} keywords have been set.`);
        setKeywordsAreSetByUser(true);
    } else {
        alert("Please enter at least one keyword.");
    }
  };

  const handleResetKeywords = () => {
    setKeywords(INITIAL_KEYWORDS);
    setResetCounter(c => c + 1); 
  };
  
  const stopTranscription = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (outputNodeRef.current) {
        outputNodeRef.current.disconnect();
        outputNodeRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(console.error);
      outputAudioContextRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentSpeaker('Not Connected');
    currentInputTranscription.current = '';
  }, []);

  const handleResetSession = () => {
    stopTranscription(); 
    setTranscript([]);
    fullTranscriptRef.current = [];
    entryIdCounter.current = 0;
    setDetections([]);
    setChartDetections([]);
    detectionIdCounter.current = 0;
    setKeywords(INITIAL_KEYWORDS);
    setSessionTime(0);
    setWordCount(0);
    setMentionCount(0);
    setCurrentSpeaker('Not Connected');
    setMarketUrl('');
    setManualKeywords('');
    setMarketData(null);
    setKeywordsAreSetByUser(false);
    setResetCounter(c => c + 1);
    setSessionStoppedByUser(false);
  };

  const handleUserStop = useCallback(() => {
    setSessionStoppedByUser(true);
    stopTranscription();
  }, [stopTranscription]);

  const handleExportTranscript = () => {
    if (fullTranscriptRef.current.length === 0) {
      alert("No transcript data to export.");
      return;
    }

    const formatTime = (totalSeconds: number): string => {
      const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    let transcriptText = `# Session Transcript\n\n`;
    transcriptText += `## Metadata\n`;
    transcriptText += `- **Exported On:** ${new Date().toLocaleString()}\n`;
    transcriptText += `- **Session Duration:** ${formatTime(sessionTime)}\n`;
    transcriptText += `- **Total Words:** ${wordCount}\n`;
    transcriptText += `- **Total Mentions:** ${mentionCount}\n\n`;
    transcriptText += `---\n\n`;
    transcriptText += `## Conversation\n\n`;

    if (fullTranscriptRef.current.length > 0) {
      let currentSpeaker = fullTranscriptRef.current[0].speaker;
      let segment = '';

      for (const entry of fullTranscriptRef.current) {
        if (entry.speaker !== currentSpeaker && segment.trim() !== '') {
          transcriptText += `**${currentSpeaker}:** ${segment.trim()}\n\n`;
          currentSpeaker = entry.speaker;
          segment = '';
        }
        segment += entry.word + ' ';
      }
      
      if (segment.trim() !== '') {
        transcriptText += `**${currentSpeaker}:** ${segment.trim()}\n`;
      }
    }

    transcriptText += `\n---\n\n# End of Transcript`;

    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `transcript-session-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startTranscription = useCallback(async (sourceType: 'microphone' | 'system') => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setTranscript([]);
    fullTranscriptRef.current = [];
    entryIdCounter.current = 0;
    setDetections([]);
    setChartDetections([]);
    detectionIdCounter.current = 0;
    setSessionStoppedByUser(false);
    currentGainRef.current = 1.0; // Reset adaptive gain for new session

    // Reset adaptive buffer state
    audioQueueRef.current = [];
    adaptiveBufferSizeRef.current = 4096 * 2; // Default size
    lastReceiveTimeRef.current = 0; // Reset last receive time

    try {
      const stream = sourceType === 'microphone'
        ? await navigator.mediaDevices.getUserMedia({ audio: true })
        : await (navigator.mediaDevices as any).getDisplayMedia({
            video: true,
            audio: true,
          });

      if (stream.getAudioTracks().length === 0) {
        stream.getVideoTracks().forEach(track => track.stop());
        throw new Error(`The selected ${sourceType} source has no audio tracks. Please select a source with audio (e.g., a browser tab with audio playing, or check the 'Share system audio' box).`);
      }

      audioStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputAudioContext;

      const outputNode = outputAudioContext.createGain();
      outputNode.gain.value = 0; // Mute the output, as we only need to process it
      outputNode.connect(outputAudioContext.destination);
      outputNodeRef.current = outputNode;

      nextStartTime.current = 0;
      sourcesRef.current.clear();

      const source = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (audioProcessingEvent: AudioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);

        // --- START ADAPTIVE GAIN LOGIC ---
        let peak = 0;
        for (let i = 0; i < inputData.length; i++) {
            const absValue = Math.abs(inputData[i]);
            if (absValue > peak) {
                peak = absValue;
            }
        }
        
        const TARGET_PEAK = 0.7;
        const MAX_GAIN = 4.0;
        const MIN_GAIN = 0.25;
        const SMOOTHING_FACTOR = 0.02;

        let currentGain = currentGainRef.current;
        let targetGain = currentGain;
        
        if (peak > 0.01) { // Only adjust if there's significant sound
            targetGain = TARGET_PEAK / peak;
        }
        
        // Clamp the target gain
        targetGain = Math.max(MIN_GAIN, Math.min(targetGain, MAX_GAIN));
        
        // Smoothly move current gain towards target gain
        currentGain = currentGain + (targetGain - currentGain) * SMOOTHING_FACTOR;
        currentGainRef.current = currentGain;

        // Apply the gain to a new audio data buffer, creating a clone in the process
        const gainAdjustedData = new Float32Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const boostedSample = inputData[i] * currentGain;
            // Simple hard limiter to prevent clipping after gain application
            gainAdjustedData[i] = Math.max(-1.0, Math.min(1.0, boostedSample));
        }
        // --- END ADAPTIVE GAIN LOGIC ---

        audioQueueRef.current.push(gainAdjustedData);

        const currentQueueSize = audioQueueRef.current.reduce((sum, arr) => sum + arr.length, 0);

        // Send audio data only when the adaptive buffer is full
        if (currentQueueSize >= adaptiveBufferSizeRef.current) {
            const audioToSend = concatenateFloat32Arrays(audioQueueRef.current);
            audioQueueRef.current = []; // Clear the queue

            const pcmBlob: Blob = {
              data: encode(
                new Uint8Array(
                  new Int16Array(audioToSend.map(f => f * 32768)).buffer
                )
              ),
              mimeType: 'audio/pcm;rate=16000',
            };
            
            sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            setSessionStartTime(Date.now());
            setCurrentSpeaker('Listening...');
          },
          onmessage: async (message: LiveServerMessage) => {
            const now = Date.now();
            // Implement adaptive buffering logic based on message arrival frequency
            if (lastReceiveTimeRef.current > 0) {
                const timeSinceLastMessage = now - lastReceiveTimeRef.current;
                
                // Constants for buffer size adjustment
                const MAX_BUFFER_SIZE = 4096 * 10; // ~2.5 seconds of audio
                const MIN_BUFFER_SIZE = 4096;      // ~0.25 seconds of audio
                const HIGH_LATENCY_THRESHOLD = 800; // ms
                const LOW_LATENCY_THRESHOLD = 300;  // ms

                if (timeSinceLastMessage > HIGH_LATENCY_THRESHOLD) {
                    // High latency detected: increase buffer size to send larger, less frequent chunks
                    adaptiveBufferSizeRef.current = Math.min(
                        MAX_BUFFER_SIZE, 
                        Math.ceil(adaptiveBufferSizeRef.current * 1.5)
                    );
                } else if (timeSinceLastMessage < LOW_LATENCY_THRESHOLD) {
                    // Low latency: decrease buffer size for faster, more responsive transcription
                    adaptiveBufferSizeRef.current = Math.max(
                        MIN_BUFFER_SIZE,
                        Math.floor(adaptiveBufferSizeRef.current / 1.5)
                    );
                }
            }
            lastReceiveTimeRef.current = now;

            const modelTurn = message.serverContent?.modelTurn;
            if (modelTurn && modelTurn.parts && modelTurn.parts.length > 0 && modelTurn.parts[0].inlineData) {
              const base64EncodedAudioString = modelTurn.parts[0].inlineData.data;

              if (base64EncodedAudioString && outputAudioContextRef.current && outputNodeRef.current && outputAudioContextRef.current.state !== 'closed') {
                try {
                  const outputAudioContext = outputAudioContextRef.current;
                  const outputNode = outputNodeRef.current;

                  nextStartTime.current = Math.max(
                    nextStartTime.current,
                    outputAudioContext.currentTime,
                  );
                  
                  const audioBuffer = await decodeAudioData(
                    decode(base64EncodedAudioString),
                    outputAudioContext,
                    24000,
                    1,
                  );

                  const sourceNode = outputAudioContext.createBufferSource();
                  sourceNode.buffer = audioBuffer;
                  sourceNode.connect(outputNode);
                  
                  sourceNode.addEventListener('ended', () => {
                    sourcesRef.current.delete(sourceNode);
                  });

                  sourceNode.start(nextStartTime.current);
                  nextStartTime.current = nextStartTime.current + audioBuffer.duration;
                  sourcesRef.current.add(sourceNode);
                } catch (e) {
                  console.error("Error processing audio data from Gemini:", e);
                }
              }
            }

            const transcription = message.serverContent?.inputTranscription;
            if (transcription?.text) {
              const newFullText = transcription.text;
              const oldFullText = currentInputTranscription.current;
          
              if (newFullText.length > oldFullText.length) {
                const oldWords = oldFullText.trim().split(/\s+/).filter(Boolean);
                const newWordsList = newFullText.trim().split(/\s+/).filter(Boolean);
          
                let firstDiffIndex = 0;
                while (
                  firstDiffIndex < oldWords.length &&
                  firstDiffIndex < newWordsList.length &&
                  oldWords[firstDiffIndex] === newWordsList[firstDiffIndex]
                ) {
                  firstDiffIndex++;
                }
          
                const numWordsToRemove = oldWords.length - firstDiffIndex;
                const wordsToProcess = newWordsList.slice(firstDiffIndex);
          
                if (wordsToProcess.length === 0) {
                  currentInputTranscription.current = newFullText;
                  return;
                }
          
                currentInputTranscription.current = newFullText;
          
                let speakerForThisBatch = 'Unknown';
                const transcriptionWithSegments = transcription as any;
                if (transcriptionWithSegments.segments && transcriptionWithSegments.segments.length > 0) {
                  const lastSegment = transcriptionWithSegments.segments[transcriptionWithSegments.segments.length - 1];
                  if (lastSegment.speakerLabel) {
                    const formattedSpeaker = lastSegment.speakerLabel.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                    speakerForThisBatch = formattedSpeaker;
                    setCurrentSpeaker(formattedSpeaker);
                  }
                }
          
                const textChunk = wordsToProcess.join(' ');
                const lowerCaseNewText = textChunk.toLowerCase();
                const newDetections: DetectionEvent[] = [];
                const keywordUpdates = new Map<string, number>();
                const alertedWordIndices = new Set<number>();
                const keywordsThatReachedTarget = new Set<string>();
          
                let currentTextIndex = 0;
                const wordIndexMap = wordsToProcess.map(word => {
                  const startIndex = textChunk.indexOf(word, currentTextIndex);
                  const endIndex = startIndex === -1 ? -1 : startIndex + word.length;
                  if (startIndex !== -1) {
                    currentTextIndex = endIndex;
                  }
                  return { startIndex, endIndex };
                });
          
                keywords.forEach(kw => {
                  const searchTerms = [kw.keyword, ...(kw.aliases || [])].map(k => k.toLowerCase()).filter(Boolean);
                  if (searchTerms.length === 0) return;
          
                  const regexPattern = searchTerms
                    .map(term => `\\b${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`)
                    .join('|');
          
                  const regex = new RegExp(`(${regexPattern})`, 'gi');
          
                  const allMatchesForKeyword: { startIndex: number, endIndex: number, text: string }[] = [];
                  let match;
                  while ((match = regex.exec(lowerCaseNewText)) !== null) {
                    allMatchesForKeyword.push({
                      startIndex: match.index,
                      endIndex: match.index + match[0].length,
                      text: match[0],
                    });
                  }
          
                  if (allMatchesForKeyword.length > 0) {
                    let countForThisKeyword = kw.count;
                    keywordUpdates.set(kw.keyword, countForThisKeyword + allMatchesForKeyword.length);
          
                    allMatchesForKeyword.forEach(matchInstance => {
                      countForThisKeyword++;
          
                      const textBeforeMatch = textChunk.substring(0, matchInstance.startIndex);
                      const textAfterMatch = textChunk.substring(matchInstance.endIndex);
          
                      let sentenceStart = textBeforeMatch.lastIndexOf('.');
                      sentenceStart = Math.max(sentenceStart, textBeforeMatch.lastIndexOf('?'));
                      sentenceStart = Math.max(sentenceStart, textBeforeMatch.lastIndexOf('!'));
          
                      let sentenceEnd = textAfterMatch.indexOf('.');
                      const endQuestion = textAfterMatch.indexOf('?');
                      const endExclamation = textAfterMatch.indexOf('!');
          
                      let minEnd = Infinity;
                      if (sentenceEnd !== -1) minEnd = Math.min(minEnd, sentenceEnd);
                      if (endQuestion !== -1) minEnd = Math.min(minEnd, endQuestion);
                      if (endExclamation !== -1) minEnd = Math.min(minEnd, endExclamation);
          
                      const fullContext = newFullText; // Use the full text for context
          
                      newDetections.push({
                        id: `detection-${detectionIdCounter.current++}`,
                        keyword: kw.keyword,
                        word: matchInstance.text,
                        speaker: speakerForThisBatch,
                        time: new Date().toLocaleTimeString(),
                        sessionTimestamp: (Date.now() - sessionStartTime!) / 1000,
                        context: fullContext,
                      });
          
                      if (countForThisKeyword === kw.target) {
                        keywordsThatReachedTarget.add(kw.keyword);
                        wordIndexMap.forEach((wordMeta, index) => {
                          if (wordMeta.startIndex !== -1 && matchInstance.startIndex < wordMeta.endIndex && matchInstance.endIndex > wordMeta.startIndex) {
                            alertedWordIndices.add(index);
                          }
                        });
                      }
                    });
                  }
                });
          
                const newEntries: TranscriptEntry[] = wordsToProcess.map((word, index) => ({
                  id: `entry-${entryIdCounter.current++}`,
                  word,
                  speaker: speakerForThisBatch,
                  time: new Date().toLocaleTimeString(),
                  isAlert: alertedWordIndices.has(index),
                }));
          
                if (newDetections.length > 0) {
                  setDetections(prev => [...prev, ...newDetections].slice(-100));
                  setChartDetections(prev => [...prev, ...newDetections]);
                }
          
                if (keywordUpdates.size > 0) {
                  setMentionCount(prev => prev + newDetections.length);
          
                  setKeywords(prevKeywords =>
                    prevKeywords.map(k => {
                      const updatedKeyword = { ...k };
                      if (keywordUpdates.has(k.keyword)) {
                        updatedKeyword.count = keywordUpdates.get(k.keyword)!;
                      }
                      if (keywordsThatReachedTarget.has(k.keyword)) {
                        updatedKeyword.isMentioned = true;
                      }
                      return updatedKeyword;
                    })
                  );
          
                  if (keywordsThatReachedTarget.size > 0) {
                    setTimeout(() => {
                      setKeywords(prevKeywords =>
                        prevKeywords.map(k =>
                          keywordsThatReachedTarget.has(k.keyword) ? { ...k, isMentioned: false } : k
                        )
                      );
                    }, 1500);
                  }
                }
          
                setTranscript(prev => {
                  const transcriptAfterRemovals = prev.slice(numWordsToRemove);
                  return [...newEntries.reverse(), ...transcriptAfterRemovals].slice(0, 100);
                });
          
                fullTranscriptRef.current.splice(fullTranscriptRef.current.length - numWordsToRemove, numWordsToRemove);
                fullTranscriptRef.current.push(...newEntries);
          
                setWordCount(prev => prev - numWordsToRemove + wordsToProcess.length);
              }
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'identify_the_words') {
                  // FIX: Property 'toLowerCase' does not exist on type 'unknown'.
                  const wordVariant = typeof fc.args.word === 'string' ? fc.args.word.toLowerCase() : undefined;
                  if (wordVariant && CANONICAL_WORD_MAP[wordVariant]) {
                    const canonicalWord = CANONICAL_WORD_MAP[wordVariant];
            
                    // Update the visible transcript state
                    setTranscript(prevTranscript => {
                      const newTranscript = [...prevTranscript];
                      for (let i = newTranscript.length - 1; i >= 0; i--) {
                        if (normalizeWord(newTranscript[i].word) === wordVariant) {
                          newTranscript[i] = { ...newTranscript[i], word: canonicalWord };
                          break; 
                        }
                      }
                      return newTranscript;
                    });
            
                    // Update the full transcript ref for export consistency
                    const fullTranscript = fullTranscriptRef.current;
                    for (let i = fullTranscript.length - 1; i >= 0; i--) {
                      if (normalizeWord(fullTranscript[i].word) === wordVariant) {
                        fullTranscript[i] = { ...fullTranscript[i], word: canonicalWord };
                        break;
                      }
                    }
                  }
            
                  // Send response back to model to confirm processing
                  sessionPromiseRef.current?.then((session) => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: `Processed word variant: ${wordVariant}` },
                      }
                    });
                  });
                }
              }
            }

            if (message.serverContent?.turnComplete) {
              // Although the live transcript is handled, resetting the ref on turn complete
              // can help manage memory and prevent extremely long text comparisons.
              currentInputTranscription.current = '';
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live API Error:', e);
            if (e.message && (e.message.includes('Requested entity was not found') || e.message.includes('does not have permission'))) {
                alert('Your API key is invalid or lacks the required permissions. Please select a valid key to continue.');
                setApiKeyIsSelected(false);
            } else {
                alert('A connection error occurred with the transcription service. Please try again.');
            }
            stopTranscription();
          },
          onclose: () => {
            stopTranscription();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {
          },
          systemInstruction: `You are a helpful transcription assistant. Your primary task is to transcribe speech accurately. You have a tool called "identify_the_words" that you must call whenever you detect a word that might have a common phonetic or regional spelling variation (e.g., colour/color, aluminium/aluminum). Pass the detected word variant to this tool.`,
          tools: [{ functionDeclarations: [identifyWordsFunctionDeclaration] }],
        },
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error('Failed to start transcription:', error);
      let message = "Could not start transcription due to an unexpected error. Please check the browser console for more details.";
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
          message = `Permission to access your ${sourceType} was denied. To use this feature, please grant the required permissions in your browser/system settings and try again.`;
      } else if (error instanceof Error) {
          message = error.message;
      }
      alert(message);
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, stopTranscription, keywords]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Ignore shortcuts if the user is typing in an input field, which can happen in the OCR modal or keyword list
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Use Ctrl on Windows/Linux and Cmd on macOS
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          // Shortcut to stop the session
          case 's':
            if (isConnected) {
              event.preventDefault();
              handleUserStop();
            }
            break;
          
          // Shortcut to toggle the OCR modal
          case 'o':
            event.preventDefault();
            setIsOcrModalOpen(prev => !prev);
            break;

          // Shortcut to swap views
          case 'v':
            event.preventDefault();
            setPage(p => (p === 'recognition' ? 'trade' : 'recognition'));
            break;
          
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConnected, handleUserStop]);

  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  const handleOcrRequest = async (file: File): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const base64Data = await fileToBase64(file);

      const imagePart = {
          inlineData: {
              mimeType: file.type,
              data: base64Data,
          },
      };

      const textPart = {
          text: "Extract all text from this image, including handwritten and printed text. Preserve the original formatting as much as possible.",
      };

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, textPart] },
      });

      return response.text;
    } catch (error) {
        console.error('OCR Extraction failed:', error);
        if (error instanceof Error && (error.message.includes('Requested entity was not found') || error.message.includes('does not have permission'))) {
            alert('Your API key is invalid or lacks the required permissions. Please select a valid key to continue.');
            setApiKeyIsSelected(false);
            setIsOcrModalOpen(false);
        }
        throw error;
    }
  };

  return (
    <div className="bg-black min-h-screen flex flex-col p-4 font-sans text-gray-300">
      <Header 
        isConnected={isConnected} 
        onStop={handleUserStop}
        onOpenOcr={() => setIsOcrModalOpen(true)}
        currentPage={page}
        onSwapView={() => setPage(p => p === 'recognition' ? 'trade' : 'recognition')}
      />
      {page === 'recognition' ? (
        <>
          <main className="flex-grow flex flex-col gap-4 my-4 overflow-hidden">
            {!isConnected && !isConnecting ? (
              <div className="absolute inset-0 flex justify-center items-start overflow-y-auto bg-black bg-opacity-80 z-10 p-4 sm:p-8">
                {!apiKeyIsSelected ? (
                  <div className="text-center p-8 border border-gray-800 bg-[#1C1C1E] rounded-lg max-w-lg w-full">
                    <h2 className="text-xl text-gray-100 font-semibold mb-4">API Key Required</h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        To use this application, you need to select a Gemini API key. This application uses models that may require billing to be enabled.
                    </p>
                    <p className="text-gray-400 mb-6 text-sm">
                        For more information on billing, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Gemini API billing documentation</a>.
                    </p>
                    <button
                        onClick={handleSelectApiKey}
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-500 transition-colors duration-200"
                    >
                        Select API Key
                    </button>
                  </div>
                ) : sessionStoppedByUser ? (
                  <div className="text-center p-8 border border-gray-800 bg-[#1C1C1E] rounded-lg max-w-lg w-full">
                    <h2 className="text-xl text-gray-100 font-semibold mb-4">Session Ended</h2>
                    <p className="text-gray-400 mb-6 text-sm">
                      Your session has concluded. You can export the transcript from the session or start a new one.
                    </p>
                    <div className="border-t border-gray-700 pt-6">
                      <h3 className="text-lg text-gray-200 font-medium mb-3">Session Actions</h3>
                      <p className="text-gray-400 mb-4 text-sm">
                        Export the full transcript from your last session or clear all data to start fresh.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={handleExportTranscript}
                          className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-500 transition-colors duration-200"
                        >
                          Export Transcript
                        </button>
                        <button
                          onClick={handleResetSession}
                          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-200"
                        >
                          Start New Session
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border border-gray-800 bg-[#1C1C1E] rounded-lg max-w-xl w-full">
                      <h2 className="text-xl text-gray-100 font-semibold mb-6">System Configuration</h2>
                      
                      <div className="mb-6 border-b border-gray-800 pb-6">
                        <h3 className="text-lg text-gray-200 font-medium mb-3">1. Import from Prediction Market (Auto)</h3>
                        <p className="text-gray-400 mb-4 text-sm">
                          Paste a link from Kalshi, Polymarket, etc. Import will start automatically.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={marketUrl}
                            onChange={(e) => setMarketUrl(e.target.value)}
                            placeholder="https://polymarket.com/event/..."
                            className="bg-gray-900 border border-gray-700 w-full p-2 text-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                            disabled={isImporting}
                            aria-label="Prediction market URL input"
                          />
                        </div>
                        <div className="mt-4 min-h-[50px]">
                          {isImporting ? (
                            <div className="text-sm text-gray-400 animate-pulse">Parsing market data with Gemini...</div>
                          ) : marketData ? (
                            <MarketDisplay marketData={marketData} />
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="mb-6 border-b border-gray-800 pb-6">
                        <h3 className="text-lg text-gray-200 font-medium mb-3">2. Manually Enter Keywords</h3>
                        <p className="text-gray-400 mb-4 text-sm">
                          Use formats like KEYWORD:COUNT, 5+ KEYWORD, or KEYWORD+++.
                        </p>
                         <textarea
                            className="bg-gray-900 border border-gray-700 w-full p-2 text-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                            rows={4}
                            placeholder="e.g., TRUMP:8, 5+ BIDEN, AI+++, ELECTION"
                            value={manualKeywords}
                            onChange={(e) => setManualKeywords(e.target.value)}
                            aria-label="Manual keywords input"
                          />
                          <button
                            onClick={handleSetManualKeywords}
                            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-200 w-full"
                          >
                            Set Manual Keywords
                          </button>
                      </div>

                      <div className="mb-2">
                        <h3 className="text-lg text-gray-200 font-medium mb-3">3. Select Audio Source</h3>
                        {!keywordsAreSetByUser ? (
                          <p className="text-yellow-500 mb-6 text-sm">
                            Please complete Step 1 or 2 to set your keywords before starting the session.
                          </p>
                        ) : (
                          <p className="text-gray-400 mb-6 text-sm">
                            Keywords set. Choose your audio source to begin monitoring.
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => startTranscription('microphone')}
                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!keywordsAreSetByUser}
                            >
                                Monitor Microphone
                            </button>
                            <button 
                                onClick={() => startTranscription('system')}
                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!keywordsAreSetByUser}
                            >
                                Monitor System Audio
                            </button>
                        </div>
                      </div>
                  </div>
                )}
              </div>
            ) : null}

            {isConnecting && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
                    <div className="text-center p-8 border border-gray-800 bg-[#1C1C1E] rounded-lg">
                         <h2 className="text-xl text-gray-100 font-semibold mb-4">Connecting...</h2>
                         <p className="text-gray-400">Please grant audio permissions in your browser.</p>
                         <div className="mt-4 text-2xl animate-pulse text-blue-400">...</div>
                    </div>
                 </div>
            )}
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                <div className="w-full md:w-2/3 h-full">
                    <TranscriptFeed entries={transcript} />
                </div>
                <div className="w-full md:w-1/3 h-full">
                    <KeywordList 
                        key={resetCounter}
                        keywords={keywords}
                        onUpdateKeywords={handleUpdateKeywords}
                        onResetKeywords={handleResetKeywords}
                        onDeleteKeyword={handleDeleteKeyword}
                        onResetKeywordCount={handleResetKeywordCount}
                        onEditKeyword={handleEditKeyword}
                    />
                </div>
            </div>
            <div className="flex-shrink-0 flex flex-col md:flex-row gap-4" style={{ height: '35%' }}>
              <div className="w-full md:w-1/2 h-full">
                  <DetectionLog detections={detections} />
              </div>
              <div className="w-full md:w-1/2 h-full">
                  <DetectionChart detections={chartDetections} sessionTime={sessionTime} keywords={keywords} />
              </div>
            </div>
          </main>
          <Footer
            sessionTime={sessionTime}
            wordCount={wordCount}
            mentionCount={mentionCount}
            speaker={currentSpeaker}
          />
        </>
      ) : (
        <TradePage />
      )}
      <OcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onExtract={handleOcrRequest}
      />
    </div>
  );
};

export default App;
