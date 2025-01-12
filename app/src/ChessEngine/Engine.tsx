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
    p: [16, 32, 17, 15],// black pawn attack front, 2front, left, right [17,15] for enpassee action
    P: [-16, -32, -17, -15],// white pawn attack front, 2front, left, right [-17,-15] for enpassee action
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
    public turn:number = 1;
    public halfmove:number = 0;// this will hold the number of half moves (Halfmove clock: This is the number of halfmoves since the last capture or pawn advance. The reason for this field is)
    public active:string = 'w';
    public Kings:Record<string, number> = {w:0, b:0};// this will hold the position of the kings in the 0x88 board
    public castling:Record<string, number> = {w: 0, b: 0};// this will hold 2 if king side and 3 if queen side or 5 if both 0x88 board
    public enpassant:number = -1;// this will hold the position of the enpassant square in the 0x88 board
    public history:Array<Move> = [];
    public availbleMoves:Array<Move> = [];
    public possible_captures:Record<number, Array<number>>={};// this will hold the possible captures for the current player
    public possible_moves_for_each_peace:Record<number, Array<number>>={};// this will have the possible moves for each peace
    public gameover:boolean = false;
    public check:boolean = false;
    public winner:string = '';
    public checkmate:boolean = false;
    public stalemate:boolean = false;
    public fiftyMoveRule:boolean = false;
    public threefoldRepetition:boolean = false;
    public draw:boolean = false;
    public error:boolean = false;
    public error_message:string = '';

    constructor(){
        this.initBoard();
    }

    initBoard(){
        let default_index = 0;
        for(let i = 0; i < 128; i++){
            if((i & 0x88) === 0){
                if (DEFAULT_BOARD[default_index] !== ' ')
                    this.board[i] =  DEFAULT_BOARD[default_index] as Piece;
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
        this.possible_captures = {};
        this.possible_moves_for_each_peace = {};
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

    gen_moves(index:number, ){
        // identify the piece moves then check if the move is valid
        let piece = this.board[index];
        let color = piece === piece.toUpperCase() ? 'w' : 'b';
        let pieceType = (piece.toLowerCase() === 'p') ? piece : piece.toLowerCase();
        // console.log(pieceType);
        let offset:number[] = OFFSETS[pieceType];
    
        for (let i = 0; i < offset.length; i++){
            let next = index;
            // check for next possible moves depending  on the offset
            while (true)
            {
                next += offset[i];
                // console.log(piece,index,next);
                // check if the piece is out of the board
                if ((next & 0x88) !== 0){
                    break;
                }
                // in case of empty square
                if (this.board[next] === null)
                {
                    // check if the piece is a pawn
                    if (pieceType === 'p' || pieceType === 'P'){
                        // check if the Offset is for enpassants
                        if (offset[i] === 17 || offset[i] === 15 || offset[i] === -17 || offset[i] === -15){
                            // chech if the next is enpassant square
                            if (next === this.enpassant){
                                this.availbleMoves.push(new Move(index, next, piece, color));
                                // add the possible moves for the current piece
                                if (!this.possible_moves_for_each_peace[index]) {
                                    // If the key does not exist, initialize it as an empty array
                                    this.possible_moves_for_each_peace[index] = [];
                                }
                                this.possible_moves_for_each_peace[index].push(next);
                                // add the possible captures for the current player
                                if (!this.possible_captures[index]) {
                                    // If the key does not exist, initialize it as an empty array
                                    this.possible_captures[index] = [];
                                }
                                this.possible_captures[index].push(next);
                                break;
                            }
                            else{
                                break;
                            }
                        }
                    }
                    this.availbleMoves.push(new Move(index, next, piece, color));
                    // add the possible moves for the current piece
                    if (!this.possible_moves_for_each_peace[index]) {
                        // If the key does not exist, initialize it as an empty array
                        this.possible_moves_for_each_peace[index] = [];
                    }
                    this.possible_moves_for_each_peace[index].push(next);
                }
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
                        // add the possible moves for the current piece
                        if (!this.possible_moves_for_each_peace[index]) {
                            // If the key does not exist, initialize it as an empty array
                            this.possible_moves_for_each_peace[index] = [];
                        }
                        this.possible_moves_for_each_peace[index].push(next);
                        // add the possible captures for the current player
                        if (!this.possible_captures[index]) {
                            // If the key does not exist, initialize it as an empty array
                            this.possible_captures[index] = [];
                        }
                        this.possible_captures[index].push(next);
                        // in case of the king we will have a threat (check)
                        // //if (nextPiece.toLowerCase() === 'k'){
                        //  //    this.possible_captures[index].push(next);
                        // //}
                        break;
                    }
                }

                if (pieceType === 'p' ||  pieceType === 'P' || pieceType === 'k' || pieceType === 'n'){
                    break;
                }
            }
        }
    }

    _get_active_availble_moves():number
    {
        this.availbleMoves = [];
        this.possible_captures = {};
        this.possible_moves_for_each_peace = {};
        for(let i = 0; i < 128; i++){
            // avoid null square
            // console.log(this.board[i], i);
            if (this.board[i] === null)
                continue;
            if((i & 0x88) === 0 && this.isActivesPiece(i)){
                // console.log(i);
                this.gen_moves(i);
            }
            // if (this.board[i] === null)
            //     console.log(i);
        }

        for (const move of this.availbleMoves){
            console.log(move.from, move.to, move.piece, move.color);
        }

        for (const key in this.possible_captures){
            console.log(key, this.possible_captures[key]);
        }

        for (const key in this.possible_moves_for_each_peace){
            console.log(key, this.possible_moves_for_each_peace[key]);
        }
        return this.availbleMoves.length;
    }

    load(fen_map:string):boolean{
        this.initBoard();
        this.board = new Array(128).fill(null);
        let fen = fen_map.split(' ');
        let fen_board = fen[0];
        let fen_turn = fen[1];
        let fen_castling = fen[2];
        let fen_enpassant = fen[3];
        let fen_halfmove = fen[4];
        let fen_fullmove = fen[5];

        // check if the fen is valid
        console.log(fen_board, fen_turn, fen_castling, fen_enpassant, fen_halfmove, fen_fullmove);
        let fen_board_rows = fen_board.split('/');
        if (fen_board_rows.length !== 8){
            return false;
        }
        // load the board
        let middle:string = "";
        for (let i = 0; i < fen_board.length; i++){
            if (fen_board[i] === '/'){
                continue;
            }
            if (fen_board[i].toLowerCase() in WHITEPIECES || fen_board[i].toLowerCase() in BLACKPIECES){
                middle += fen_board[i];
            }else if (fen_board[i] >= '1' && fen_board[i] <= '8'){
                let count = parseInt(fen_board[i]);
                middle += ' '.repeat(count);
            }
            else
            {
                console.log("middle:", middle, "[",fen_board[i]);
                return false;
            }
        }
        console.log("middle:", middle);
        let index = 0;
        for (let i = 0; i < 128; i++)
        {
            if ((i & 0x88) === 0){
                if (middle[index] !== ' '){
                    this.board[i] = middle[index] as Piece;
                }
                index++;
            }
        }
        // load the turn
        this.turn = parseInt(fen_turn);
        // load the castling
        this.castling = {w: 0, b: 0};
        for (let i = 0; i < fen_castling.length; i++){
            if (fen_castling[i] === 'K'){
                this.castling.w |= 2;
            }
            if (fen_castling[i] === 'Q'){
                this.castling.w |= 4;
            }
            if (fen_castling[i] === 'k'){
                this.castling.b |= 2;
            }
            if (fen_castling[i] === 'q'){
                this.castling.b |= 4;
            }
            if (fen_castling[i] !== '-' && fen_castling[i] !== 'K' && fen_castling[i] !== 'Q' && fen_castling[i] !== 'k' && fen_castling[i] !== 'q')
                return false;
        }

        // load the enpassant
        if (fen_enpassant === '-'){
            this.enpassant = -1;
        }
        else if (fen_enpassant in Ox88){
            this.enpassant = Ox88[fen_enpassant];
        }
        else{
            return false;
        }
        // load the halfmove
        if (!isNaN(parseInt(fen_halfmove))){
            this.halfmove = parseInt(fen_halfmove);
        }
        else
            return false;
        // load the fullmove
        if (!isNaN(parseInt(fen_fullmove))){
            this.turn = parseInt(fen_fullmove);
        }
        else
            return false;
        return true;
    }

    getFen():string{
        let fen = '';
        for (let i = 0; i < 128; i++){
            if ((i & 0x88) === 0){
                if (this.board[i] === null){
                    fen += ' ';
                }
                else{
                    fen += this.board[i];
                }
            }
        }
        fen += ' ';
        fen += this.active;
        fen += ' ';
        if (this.castling.w === 0 && this.castling.b === 0){
            fen += '-';
        }
        else{
            if (this.castling.w & 2){
                fen += 'K';
            }
            if (this.castling.w & 4){
                fen += 'Q';
            }
            if (this.castling.b & 2){
                fen += 'k';
            }
            if (this.castling.b & 4){
                fen += 'q';
            }
        }
        fen += ' ';
        if (this.enpassant === -1){
            fen += '-';
        }
        else{
            for (const key in Ox88){
                if (Ox88[key] === this.enpassant){
                    fen += key;
                }
            }
        }
        fen += ' ';
        fen += this.halfmove;
        fen += ' ';
        fen += this.turn;
        return fen;
    }

    load_fen(fen:string):boolean{
        console.log(fen);
        let fen_map = fen.split(' ');
        if (fen_map.length !== 6){
            this.error = true;
            this.error_message = 'Invalid FEN';
            return false;
        }
        if (!this.load(fen)){
            this.error = true;
            this.error_message = 'Invalid 2 FEN';
            return false;
        }
        return true;
    }
}

export default ChessBoard;