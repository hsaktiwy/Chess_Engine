import React, { useState } from 'react';
import ChessBoard from '../ChessEngine/Engine.tsx';

type Piece = 'r' | 'n' | 'b' | 'q' | 'k' | 'p' | 'R' | 'N' | 'B' | 'Q' | 'K' | 'P' | '';
type Board = Piece[][];

interface SelectedSquare {
  row: number;
  col: number;
}

interface PieceSymbols {
  [key: string]: string;
}

const ChessGUI: React.FC = () => {
  const initialBoard: Board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];

  const [board, setBoard] = useState<Board>(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);

  const getPieceSymbol = (piece: Piece): string => {
    const pieceSymbols: PieceSymbols = {
      'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
      'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
    };
    return pieceSymbols[piece] || '';
  };

  const handleSquareClick = (row: number, col: number): void => {
    // If clicking the same square twice, deselect it
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      setSelectedSquare(null);
      return;
    }

    // If no square is selected and clicked square has a piece, select it
    if (!selectedSquare) {
      if (board[row][col]) {
        setSelectedSquare({ row, col });
      }
      return;
    }

    // If a square is already selected, try to move the piece
    const newBoard: Board = board.map(row => [...row]);
    newBoard[row][col] = board[selectedSquare.row][selectedSquare.col];
    newBoard[selectedSquare.row][selectedSquare.col] = '';
    setBoard(newBoard);
    setSelectedSquare(null);
  };

  const getSquareColor = (row: number, col: number): string => {
    const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
    const isLightSquare = (row + col) % 2 === 0;
    
    if (isSelected) {
      return 'bg-yellow-200';
    }
    return isLightSquare ? 'bg-white' : 'bg-gray-400';
  };
  let  Chess:ChessBoard = new ChessBoard();
  let possible_actions:number = Chess._get_active_availble_moves();
  return (
    <div className="flex flex-col items-center p-4">
      {Chess.board+ " possible action number: " + possible_actions}
      <div className="border-2 border-gray-800">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-16 h-16 flex items-center justify-center cursor-pointer ${getSquareColor(rowIndex, colIndex)}`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                <span className="text-4xl select-none">
                  {getPieceSymbol(piece)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessGUI;