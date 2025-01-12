import React from "react";

export const WHITE = 'w'
export const BLACK = 'b'

export const PAWN = 'p'
export const KNIGHT = 'n'
export const BISHOP = 'b'
export const ROOK = 'r'
export const QUEEN = 'q'
export const KING = 'k'
export type Piece = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export const OFFSETS:Record<string, Array<number>> = {
    p: [16, 32, 17, 15],// black pawn attack front, 2front, left, right
    P: [-16, -32, -17, -15],// white pawn attack front, 2front, left, right
    n: [-18, -33, -31, -14, 18, 33, 31, 14],// knight moves imagine it on board hahahaha
    b: [-17, -15, 17, 15],// bishop moves
    r: [-16, 1, 16, -1],// rook moves
    q: [-17, -16, -15, 1, 17, 16, 15, -1],// queen moves
    k: [-17, -16, -15, 1, 17, 16, 15, -1]// king moves
}

const Ox88: Record<string, number> = {
    a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
    a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
    a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
    a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
    a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
    a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
    a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
    a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
}

// create a move class
class Move{
    public from:number;
    public to:number;
    public piece:Piece;
    public color:string;

    constructor(from:number, to:number, piece:Piece, color:string){
        this.from = from;
        this.to = to;
        this.piece = piece;
        this.color = color;
    }
    
}
const INI_KINGS_POS:Record<string, number> = {w:4, b:116};
const DEFAULT_BOARD:string = 'rnbqkbnrpppppppp                                PPPPPPPPRNBQKBNR'
const WHITEPIECES:Record<string, string> = {p:'P', n:'N', b:'B', r:'R', q:'Q', k:'K'}
const BLACKPIECES:Record<string, string> = {p:'p', n:'n', b:'b', r:'r', q:'q', k:'k'}
// create a class for the chess board
class ChessBoard
{
    public board:Array<Piece> = new Array(128).fill(null);
    public turn:number = 0;
    public active:string = 'w';
    public Kings:Record<string, number> = {w:0, b:0};// this will hold the position of the kings in the 0x88 board
    public castling:Record<string, number> = {w: 0, b: 0};// this will hold 2 if king side and 3 if queen side or 5 if both 0x88 board
    public enpassant:number = -1;// this will hold the position of the enpassant square in the 0x88 board
    public history:Array<Move> = [];
    public availbleMoves:Array<Move> = [];
    public possible_captures:Record<number, Array<number>>={};// this will hold the possible captures for the current player
    public gameover:boolean = false;
    public winner:string = '';
    public check:boolean = false;
    public checkmate:boolean = false;
    public stalemate:boolean = false;
    public fiftyMoveRule:boolean = false;
    public threefoldRepetition:boolean = false;
    public draw:boolean = false;

    constructor(){
        this.initBoard();
    }

    initBoard(){
        let default_index = 0;
        for(let i = 0; i < 128; i++){
            if((i & 0x88) === 0){
                this.board[i] =     DEFAULT_BOARD[default_index] as Piece;
                default_index++;
            }
        }
        this.castling = {w: 5, b: 5};
        this.Kings = INI_KINGS_POS
        this.turn = 1;
        this.active = 'w';
        this.enpassant = -1;
        this.history = [];
        this.availbleMoves = [];
        this.gameover = false;
        this.winner = '';
        this.check = false;
        this.checkmate = false;
        this.stalemate = false;
        this.fiftyMoveRule = false;
        this.threefoldRepetition = false;
        this.draw = false;
    }

    getPieceAt(index:number):Piece{
        return this.board[index];
    }

    getPieceAtSquare(square:string):Piece{
        return this.board[Ox88[square]];
    }

    isActivesPiece(index:number): boolean{
        if (this.active === 'w'){
            return !WHITEPIECES[this.board[index]];
        }
        if (this.active === 'b'){
            return !BLACKPIECES[this.board[index]];
        }
        return false;
    }

    gen_moves(index:number){
        // identify the piece moves then check if the move is valid
        let piece = this.board[index];
        let color = piece === piece.toUpperCase() ? 'w' : 'b';
        let pieceType = piece.toLowerCase();
        let offset = OFFSETS[pieceType];
    
        for (let i = 0; i < offset.length; i++){
            let next = index;
            while (true)
            {
                next += offset[i];
                // check if the piece is out of the board
                if ((next & 0x88) !== 0){
                    break;
                }
                // in case of empty square
                if (this.board[next] === null)
                    this.availbleMoves.push(new Move(index, next, piece, color));
                // in case of not empty square
                if (this.board[next] !== null)
                {
                    // in case of the same color
                    let nextPiece = this.board[next];
                    let nextColor = nextPiece === nextPiece.toUpperCase() ? 'w' : 'b';
                    // in case of friendly piece
                    if (color === nextColor){
                        break;
                    }
                    // in case of enemy piece
                    if (color !== nextColor){
                        this.availbleMoves.push(new Move(index, next, piece, color));
                        // in case of the king we will have a threat (check)
                        if (nextPiece.toLowerCase() === 'k'){
                            this.check = true;
                            this.possible_captures[index] = [next];
                        }
                        break;
                    }
                }
            }
        }
    }

    _availble_moves()
    {
        for(let i = 0; i < 128; i++){
            if((i & 0x88) === 0 && this.board[i] !== null && this.isActivesPiece(i)){
                this.gen_moves(i);
            }
        }
    }
}

export default ChessBoard;