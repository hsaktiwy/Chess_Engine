// import React, { useState } from 'react';
// import ChessBoard from '../ChessEngine/Engine.tsx';

// type Piece = 'r' | 'n' | 'b' | 'q' | 'k' | 'p' | 'R' | 'N' | 'B' | 'Q' | 'K' | 'P' | '';
// type Board = Piece[][];

// interface SelectedSquare {
//   row: number;
//   col: number;
// }

// interface PieceSymbols {
//   [key: string]: string;
// }

// const ChessGUI: React.FC = () => {
//   const initialBoard: Board = [
//     ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
//     ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
//     Array(8).fill(''),
//     Array(8).fill(''),
//     Array(8).fill(''),
//     Array(8).fill(''),
//     ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
//     ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
//   ];

//   const [board, setBoard] = useState<Board>(initialBoard);
//   const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);

//   const getPieceSymbol = (piece: Piece): string => {
//     const pieceSymbols: PieceSymbols = {
//       'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
//       'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
//     };
//     return pieceSymbols[piece] || '';
//   };

//   const handleSquareClick = (row: number, col: number): void => {
//     // If clicking the same square twice, deselect it
//     if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
//       setSelectedSquare(null);
//       return;
//     }

//     // If no square is selected and clicked square has a piece, select it
//     if (!selectedSquare) {
//       if (board[row][col]) {
//         setSelectedSquare({ row, col });
//       }
//       return;
//     }

//     // If a square is already selected, try to move the piece
//     const newBoard: Board = board.map(row => [...row]);
//     newBoard[row][col] = board[selectedSquare.row][selectedSquare.col];
//     newBoard[selectedSquare.row][selectedSquare.col] = '';
//     setBoard(newBoard);
//     setSelectedSquare(null);
//   };

//   const getSquareColor = (row: number, col: number): string => {
//     const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
//     const isLightSquare = (row + col) % 2 === 0;
    
//     if (isSelected) {
//       return 'bg-yellow-200';
//     }
//     return isLightSquare ? 'bg-white' : 'bg-gray-400';
//   };
//   let  Chess:ChessBoard = new ChessBoard();
//   let possible_actions:number = Chess._get_active_availble_moves();
//   return (
//     <div className="flex flex-col items-center p-4">
//       {Chess.board+ " possible action number: " + possible_actions}
//       <div className="border-2 border-gray-800">
//         {board.map((row, rowIndex) => (
//           <div key={rowIndex} className="flex">
//             {row.map((piece, colIndex) => (
//               <div
//                 key={`${rowIndex}-${colIndex}`}
//                 className={`w-16 h-16 flex items-center justify-center cursor-pointer ${getSquareColor(rowIndex, colIndex)}`}
//                 onClick={() => handleSquareClick(rowIndex, colIndex)}
//               >
//                 <span className="text-4xl select-none">
//                   {getPieceSymbol(piece)}
//                 </span>
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ChessGUI;
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
  const [chessEngine] = useState(new ChessBoard());
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  
  // load fen string
  // chessEngine.load_fen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  chessEngine.load_fen("rnb1kbnr/ppp2ppp/3p4/4p3/5P1q/8/PPPPP1PP/RNBQKBNR b KQkq f3 0 1");
  chessEngine.evaluation();
  console.log(chessEngine.board);
  console.log(chessEngine.error, chessEngine.error_message);

  // Convert 0x88 board to 8x8 array for display
  const convertEngineToDisplayBoard = (): Board => {
    const displayBoard: Board = Array(8).fill(null).map(() => Array(8).fill(''));
    let engineIndex = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = chessEngine.board[engineIndex];
        if (piece) {
          displayBoard[row][col] = piece as Piece;
        }
        engineIndex++;
      }
      engineIndex += 8; // Skip the invalid squares in 0x88 board
    }
    
    return displayBoard;
  };

  const [board, setBoard] = useState<Board>(convertEngineToDisplayBoard());
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);

  // Convert display coordinates to 0x88 index
  const toEngineIndex = (row: number, col: number): number => {
    return (row * 16) + col;
  };

  const getPieceSymbol = (piece: Piece): string => {
    const pieceSymbols: PieceSymbols = {
      'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
      'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
    };
    return pieceSymbols[piece] || '';
  };

  const isValidMove = (fromIndex: number, toIndex: number): boolean => {
    chessEngine._get_active_availble_moves();
    const moves = chessEngine.availbleMoves;
    return moves.some(move => move.from === fromIndex && move.to === toIndex);
  };

  const isPieceOwnedByCurrentPlayer = (piece: Piece): boolean => {
    if (!piece) return false;
    return turn === 'w' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
  };

  const handleSquareClick = (row: number, col: number): void => {
    const clickedPiece = board[row][col];
    
    // If no square is selected
    if (!selectedSquare) {
      if (clickedPiece && isPieceOwnedByCurrentPlayer(clickedPiece)) {
        setSelectedSquare({ row, col });
      }
      return;
    }

    // If clicking the same square, deselect it
    if (selectedSquare.row === row && selectedSquare.col === col) {
      setSelectedSquare(null);
      const fromIndex = toEngineIndex(selectedSquare.row, selectedSquare.col);
      console.log(chessEngine.possible_moves_for_each_peace[fromIndex]);
      return;
    }

    // Try to make the move
    const fromIndex = toEngineIndex(selectedSquare.row, selectedSquare.col);
    const toIndex = toEngineIndex(row, col);
    console.log(fromIndex, toIndex);
    if (isValidMove(fromIndex, toIndex)) {
      // Update engine board
      const piece = chessEngine.board[fromIndex];
      chessEngine.board[fromIndex] = null;
      chessEngine.board[toIndex] = piece;
      
      // Update display board
      const newBoard = convertEngineToDisplayBoard();
      setBoard(newBoard);
      
      // Switch turns
      setTurn(turn === 'w' ? 'b' : 'w');
      chessEngine.active = turn === 'w' ? 'b' : 'w';
    }
    
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

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 text-xl">
        {turn === 'w' ? "White's Turn" : "Black's Turn"}
      </div>
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