"use client";

import { useState, useEffect } from "react";

const STATUS_MESSAGES = [
  "Initializing Etumo Remediation Engine...",
  "Extracting raw document text and tables...",
  "Isolating flagged similarity clusters...",
  "Restructuring sentence syntax and tone...",
  "Injecting perplexity and burstiness...",
  "Preserving in-text citations...",
  "Rebuilding data tables natively...",
  "Compiling final Microsoft Word document...",
  "Applying strict academic formatting...",
  "Finalizing your clean document..."
];

const FRUIT_EMOJIS = ["🍎", "🍌", "🍉", "🍇", "🍓", "🍒", "🍍", "🥝"];

interface Card {
  id: number;
  emoji: string;
}

export default function LoadingGame({ featureName }: { featureName: string }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Memory Game State
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [solvedIndices, setSolvedIndices] = useState<number[]>([]);
  const [isBoardLocked, setIsBoardLocked] = useState(false);
  const [moves, setMoves] = useState(0);

  // 1. Handle Progress Bar & Messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 5000); 

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 50) return prev + 2;
        if (prev < 80) return prev + 1;
        if (prev < 95) return prev + 0.5;
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  // 2. Initialize Memory Game
  const initializeGame = () => {
    const shuffledCards = [...FRUIT_EMOJIS, ...FRUIT_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    
    setCards(shuffledCards);
    setFlippedIndices([]);
    setSolvedIndices([]);
    setMoves(0);
    setIsBoardLocked(false);
  };

  // Run once on mount
  useEffect(() => {
    initializeGame();
  }, []);

  // 3. Handle Card Matching Logic
  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsBoardLocked(true);
      setMoves((m) => m + 1);

      const [firstIndex, secondIndex] = flippedIndices;

      if (cards[firstIndex].emoji === cards[secondIndex].emoji) {
        // Match found
        setSolvedIndices((prev) => [...prev, firstIndex, secondIndex]);
        setFlippedIndices([]);
        setIsBoardLocked(false);
      } else {
        // No match, flip back after a short delay
        const timer = setTimeout(() => {
          setFlippedIndices([]);
          setIsBoardLocked(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [flippedIndices, cards]);

  const handleCardClick = (index: number) => {
    // Prevent clicking if board is locked, card is already flipped, or card is already solved
    if (isBoardLocked || flippedIndices.includes(index) || solvedIndices.includes(index)) {
      return;
    }
    setFlippedIndices((prev) => [...prev, index]);
  };

  const isGameWon = solvedIndices.length === 16 && cards.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 p-4 backdrop-blur-md animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white p-8 shadow-2xl relative text-center border-t-4 border-[#d97706]">
        
        {/* Loading Header */}
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-1 animate-pulse">
          Processing Document
        </h2>
        <p className="text-sm font-bold text-[#d97706] mb-6">{featureName}</p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 mb-3 overflow-hidden">
          <div 
            className="bg-black h-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Dynamic Status Text */}
        <p className="text-xs text-gray-500 font-mono h-4 mb-8">
          > {STATUS_MESSAGES[messageIndex]}
        </p>

        {/* The Memory Matching Game */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-inner">
          <div className="flex justify-between items-end mb-4">
            <div className="text-left">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-0.5">Focus Test</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Match the fruits while you wait</p>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded">
              Moves: {moves}
            </span>
          </div>
          
          {/* Card Grid */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-[240px] mx-auto mb-4 relative">
            {cards.map((card, index) => {
              const isFlipped = flippedIndices.includes(index) || solvedIndices.includes(index);
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={isBoardLocked || isFlipped}
                  className={`
                    h-14 flex items-center justify-center text-2xl rounded-md transition-all duration-300 transform preserve-3d
                    ${isFlipped ? 'bg-white border-2 border-gray-300 rotate-y-180' : 'bg-gray-800 border-b-4 border-gray-900 hover:bg-gray-700 hover:-translate-y-0.5'}
                    ${solvedIndices.includes(index) ? 'opacity-50 grayscale' : ''}
                  `}
                >
                  {/* If flipped, show emoji. If not, show a subtle pattern/icon */}
                  {isFlipped ? (
                    <span className="animate-in zoom-in duration-200">{card.emoji}</span>
                  ) : (
                    <span className="text-gray-600 text-sm">?</span>
                  )}
                </button>
              );
            })}

            {/* Win State Overlay */}
            {isGameWon && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in zoom-in duration-300 rounded-md border border-green-200">
                <span className="text-3xl mb-2">🎉</span>
                <span className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">You Won!</span>
                <button 
                  onClick={initializeGame} 
                  className="text-xs bg-[#d97706] text-white px-4 py-2 uppercase font-bold tracking-wider hover:bg-[#b45309] transition-colors rounded shadow-sm"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">
          Please do not close this window
        </p>
      </div>
    </div>
  );
}
