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

export default function LoadingGame({ featureName }: { featureName: string }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Tic Tac Toe State
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  // 1. Handle Progress Bar & Messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 5000); // Change message every 5 seconds

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Slow down the progress bar as it gets closer to 95% to wait for the actual API
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

  // 2. Tic Tac Toe Logic
  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return "Draw";
    return null;
  };

  const handlePlayerMove = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsPlayerTurn(false);

    const win = checkWinner(newBoard);
    if (win) setWinner(win);
  };

  // AI Opponent Move
  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const availableSpots = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null) as number[];
        
        if (availableSpots.length > 0) {
          const randomSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
          const newBoard = [...board];
          newBoard[randomSpot] = "O";
          setBoard(newBoard);
          
          const win = checkWinner(newBoard);
          if (win) setWinner(win);
        }
        setIsPlayerTurn(true);
      }, 600); // AI takes 600ms to "think"
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, winner]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlayerTurn(true);
  };

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
        <p className="text-xs text-gray-500 font-mono h-4 mb-10">
          > {STATUS_MESSAGES[messageIndex]}
        </p>

        {/* The Mini Game */}
        <div className="bg-gray-50 border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">Pass the Time</h3>
          <p className="text-xs text-gray-500 mb-6">Play Tic-Tac-Toe against the AI while you wait.</p>
          
          <div className="grid grid-cols-3 gap-2 w-48 mx-auto mb-4">
            {board.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handlePlayerMove(idx)}
                disabled={!!cell || !!winner || !isPlayerTurn}
                className="w-14 h-14 bg-white border-2 border-gray-300 flex items-center justify-center text-2xl font-black hover:bg-gray-100 transition-colors disabled:opacity-100"
              >
                <span className={cell === "X" ? "text-black" : "text-[#d97706]"}>{cell}</span>
              </button>
            ))}
          </div>

          <div className="h-6">
            {winner ? (
              <div className="flex items-center justify-center gap-3 animate-in zoom-in">
                <span className="text-sm font-bold text-gray-900">
                  {winner === "Draw" ? "It's a Draw!" : winner === "X" ? "You Won!" : "AI Wins!"}
                </span>
                <button onClick={resetGame} className="text-xs bg-black text-white px-3 py-1 uppercase font-bold hover:bg-gray-800">
                  Play Again
                </button>
              </div>
            ) : (
              <span className="text-xs font-medium text-gray-500">
                {isPlayerTurn ? "Your turn (X)" : "AI is thinking (O)..."}
              </span>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-widest">
          Please do not close this window
        </p>
      </div>
    </div>
  );
}
