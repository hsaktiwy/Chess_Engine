// Constants and Types
const PIECES = {
    EMPTY: 0,
    WHITE_PAWN: 1,
    WHITE_KNIGHT: 2,
    WHITE_BISHOP: 3,
    WHITE_ROOK: 4,
    WHITE_QUEEN: 5,
    WHITE_KING: 6,
    BLACK_PAWN: 7,
    BLACK_KNIGHT: 8,
    BLACK_BISHOP: 9,
    BLACK_ROOK: 10,
    BLACK_QUEEN: 11,
    BLACK_KING: 12
};

type Move = {
    from: number;
    to: number;
    piece: number;
    captured?: number;
    promotion?: number;
};

class ChessBoard {
    private board: number[];
    private turn: 'w' | 'b';
    private castling: string;
    private enPassant: number;
    private halfMoves: number;
    private fullMoves: number;
    private moveHistory: Array<{
        move: Move;
        board: number[];
        castling: string;
        enPassant: number;
        halfMoves: number;
        fullMoves: number;
        turn: 'w' | 'b';
    }>;

    constructor() {
        this.board = new Array(128).fill(PIECES.EMPTY);
        this.turn = 'w';
        this.castling = 'KQkq';
        this.enPassant = -1;
        this.halfMoves = 0;
        this.fullMoves = 1;
        this.moveHistory = [];
        this.initializeBoard();
    }

    private initializeBoard(): void {
        const startingFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        this.loadFEN(startingFEN);
    }

    public loadFEN(fen: string): void {
        const [position, turn, castling, enPassant, halfMoves, fullMoves] = fen.split(' ');
        this.board = new Array(128).fill(PIECES.EMPTY);
        
        let rank = 7;
        let file = 0;
        
        for (const char of position) {
            if (char === '/') {
                rank--;
                file = 0;
            } else if (/\d/.test(char)) {
                file += parseInt(char);
            } else {
                const square = rank * 16 + file;
                this.board[square] = this.fenCharToPiece(char);
                file++;
            }
        }

        this.turn = turn as 'w' | 'b';
        this.castling = castling;
        this.enPassant = enPassant === '-' ? -1 : this.algebraicTo0x88(enPassant);
        this.halfMoves = parseInt(halfMoves);
        this.fullMoves = parseInt(fullMoves);
    }

    private fenCharToPiece(char: string): number {
        const pieceMap: { [key: string]: number } = {
            'P': PIECES.WHITE_PAWN,
            'N': PIECES.WHITE_KNIGHT,
            'B': PIECES.WHITE_BISHOP,
            'R': PIECES.WHITE_ROOK,
            'Q': PIECES.WHITE_QUEEN,
            'K': PIECES.WHITE_KING,
            'p': PIECES.BLACK_PAWN,
            'n': PIECES.BLACK_KNIGHT,
            'b': PIECES.BLACK_BISHOP,
            'r': PIECES.BLACK_ROOK,
            'q': PIECES.BLACK_QUEEN,
            'k': PIECES.BLACK_KING
        };
        return pieceMap[char] || PIECES.EMPTY;
    }

    public getFEN(): string {
        let fen = '';
        for (let rank = 7; rank >= 0; rank--) {
            let emptySquares = 0;
            for (let file = 0; file < 8; file++) {
                const square = rank * 16 + file;
                const piece = this.board[square];
                
                if (piece === PIECES.EMPTY) {
                    emptySquares++;
                } else {
                    if (emptySquares > 0) {
                        fen += emptySquares;
                        emptySquares = 0;
                    }
                    fen += this.pieceToFenChar(piece);
                }
            }
            if (emptySquares > 0) {
                fen += emptySquares;
            }
            if (rank > 0) fen += '/';
        }

        fen += ` ${this.turn} ${this.castling} `;
        fen += this.enPassant === -1 ? '-' : this._0x88ToAlgebraic(this.enPassant);
        fen += ` ${this.halfMoves} ${this.fullMoves}`;
        
        return fen;
    }

    private pieceToFenChar(piece: number): string {
        const pieceMap: { [key: number]: string } = {
            [PIECES.WHITE_PAWN]: 'P',
            [PIECES.WHITE_KNIGHT]: 'N',
            [PIECES.WHITE_BISHOP]: 'B',
            [PIECES.WHITE_ROOK]: 'R',
            [PIECES.WHITE_QUEEN]: 'Q',
            [PIECES.WHITE_KING]: 'K',
            [PIECES.BLACK_PAWN]: 'p',
            [PIECES.BLACK_KNIGHT]: 'n',
            [PIECES.BLACK_BISHOP]: 'b',
            [PIECES.BLACK_ROOK]: 'r',
            [PIECES.BLACK_QUEEN]: 'q',
            [PIECES.BLACK_KING]: 'k'
        };
        return pieceMap[piece] || '';
    }

    public generateMoves(): Move[] {
        const moves: Move[] = [];
        for (let i = 0; i < 128; i++) {
            if ((i & 0x88) !== 0) continue;
            
            const piece = this.board[i];
            if (piece === PIECES.EMPTY) continue;
            
            if (this.turn === 'w' && piece > PIECES.WHITE_KING) continue;
            if (this.turn === 'b' && piece <= PIECES.WHITE_KING) continue;
            
            this.generatePieceMoves(i, piece, moves);
        }
        return moves;
    }

    private generatePieceMoves(square: number, piece: number, moves: Move[]): void {
        switch (piece) {
            case PIECES.WHITE_PAWN:
            case PIECES.BLACK_PAWN:
                this.generatePawnMoves(square, piece, moves);
                break;
            case PIECES.WHITE_KNIGHT:
            case PIECES.BLACK_KNIGHT:
                this.generateSlidingMoves(square, piece, moves, [-33, -31, -18, -14, 14, 18, 31, 33], 1);
                break;
            case PIECES.WHITE_BISHOP:
            case PIECES.BLACK_BISHOP:
                this.generateSlidingMoves(square, piece, moves, [-17, -15, 15, 17], 8);
                break;
            case PIECES.WHITE_ROOK:
            case PIECES.BLACK_ROOK:
                this.generateSlidingMoves(square, piece, moves, [-16, -1, 1, 16], 8);
                break;
            case PIECES.WHITE_QUEEN:
            case PIECES.BLACK_QUEEN:
                this.generateSlidingMoves(square, piece, moves, [-17, -16, -15, -1, 1, 15, 16, 17], 8);
                break;
            case PIECES.WHITE_KING:
            case PIECES.BLACK_KING:
                this.generateSlidingMoves(square, piece, moves, [-17, -16, -15, -1, 1, 15, 16, 17], 1);
                this.generateCastlingMoves(square, piece, moves);
                break;
        }
    }

    private generatePawnMoves(square: number, piece: number, moves: Move[]): void {
        const direction = piece === PIECES.WHITE_PAWN ? 16 : -16;
        const startRank = piece === PIECES.WHITE_PAWN ? 1 : 6;
        const promotionRank = piece === PIECES.WHITE_PAWN ? 7 : 0;
        
        let to = square + direction;
        if ((to & 0x88) === 0 && this.board[to] === PIECES.EMPTY) {
            if (Math.floor(to / 16) === promotionRank) {
                moves.push({
                    from: square,
                    to,
                    piece,
                    promotion: piece === PIECES.WHITE_PAWN ? PIECES.WHITE_QUEEN : PIECES.BLACK_QUEEN
                });
                moves.push({
                    from: square,
                    to,
                    piece,
                    promotion: piece === PIECES.WHITE_PAWN ? PIECES.WHITE_KNIGHT : PIECES.BLACK_KNIGHT
                });
            } else {
                moves.push({ from: square, to, piece });
            }
            
            if (Math.floor(square / 16) === startRank) {
                to = square + direction * 2;
                if ((to & 0x88) === 0 && this.board[to] === PIECES.EMPTY) {
                    moves.push({ from: square, to, piece });
                }
            }
        }
        
        for (const offset of [-1, 1]) {
            to = square + direction + offset;
            if ((to & 0x88) === 0) {
                const captured = this.board[to];
                if (captured !== PIECES.EMPTY && this.isOpponentPiece(piece, captured)) {
                    if (Math.floor(to / 16) === promotionRank) {
                        moves.push({
                            from: square,
                            to,
                            piece,
                            captured,
                            promotion: piece === PIECES.WHITE_PAWN ? PIECES.WHITE_QUEEN : PIECES.BLACK_QUEEN
                        });
                    } else {
                        moves.push({ from: square, to, piece, captured });
                    }
                }
                
                if (to === this.enPassant) {
                    moves.push({
                        from: square,
                        to,
                        piece,
                        captured: piece === PIECES.WHITE_PAWN ? PIECES.BLACK_PAWN : PIECES.WHITE_PAWN
                    });
                }
            }
        }
    }

    private generateSlidingMoves(
        square: number,
        piece: number,
        moves: Move[],
        directions: number[],
        maxDistance: number
    ): void {
        for (const direction of directions) {
            let to = square;
            for (let distance = 0; distance < maxDistance; distance++) {
                to += direction;
                if ((to & 0x88) !== 0) break;
                
                const captured = this.board[to];
                if (captured === PIECES.EMPTY) {
                    moves.push({ from: square, to, piece });
                    continue;
                }
                
                if (this.isOpponentPiece(piece, captured)) {
                    moves.push({ from: square, to, piece, captured });
                }
                break;
            }
        }
    }

    private generateCastlingMoves(square: number, piece: number, moves: Move[]): void {
        if (this.isInCheck()) return;
        
        const isWhite = piece === PIECES.WHITE_KING;
        const rank = isWhite ? 0 : 7;
        const kingside = isWhite ? 'K' : 'k';
        const queenside = isWhite ? 'Q' : 'q';
        
        if (this.castling.indexOf(kingside) !== -1) {
            const f1 = rank * 16 + 5;
            const g1 = rank * 16 + 6;
            if (this.board[f1] === PIECES.EMPTY && 
                this.board[g1] === PIECES.EMPTY &&
                !this.isSquareAttackedBy(f1, isWhite ? 'b' : 'w')) {
                moves.push({ from: square, to: g1, piece });
            }
        }
        
        if (this.castling.indexOf(queenside) !== -1) {
            const d1 = rank * 16 + 3;
            const c1 = rank * 16 + 2;
            const b1 = rank * 16 + 1;
            if (this.board[d1] === PIECES.EMPTY && 
                this.board[c1] === PIECES.EMPTY &&
                this.board[b1] === PIECES.EMPTY &&
                !this.isSquareAttackedBy(d1, isWhite ? 'b' : 'w')) {
                moves.push({ from: square, to: c1, piece });
            }
        }
    }

    public makeMove(move: Move): boolean {
        // Save state for undo
        this.moveHistory.push({
            move,
            board: [...this.board],
            castling: this.castling,
            enPassant: this.enPassant,
            halfMoves: this.halfMoves,
            fullMoves: this.fullMoves,
            turn: this.turn
        });

        // Update board
        this.board[move.to] = move.piece;
        this.board[move.from] = PIECES.EMPTY;
        
        // Handle promotions
        if (move.promotion) {
            this.board[move.to] = move.promotion;
        }
        
        // Handle en passant capture
        if (move.piece === PIECES.WHITE_PAWN || move.piece === PIECES.BLACK_PAWN) {
            if (move.to === this.enPassant) {
                this.board[this.enPassant + (move.piece === PIECES.WHITE_PAWN ? -16 : 16)] = PIECES.EMPTY;
            }
            
            // Set en passant square for double pawn push
            if (Math.abs(move.to - move.from) === 32) {
                this.enPassant = move.from + (move.piece === PIECES.WHITE_PAWN ? 16 : -16);
            } else {
                this.enPassant = -1;
            }
        }
        
        // Handle castling
        if (move.piece === PIECES.WHITE_KING || move.piece === PIECES.BLACK_KING) {
            const rank = move.piece === PIECES.WHITE_KING ? 0 : 7;
            if (Math.abs(move.to - move.from) === 2) {
                // Kingside castling
                if (move.to > move.from) {
                    this.board[rank * 16 + 7] = PIECES.EMPTY;
                    this.board[rank * 16 + 5] = move.piece === PIECES.WHITE_KING ? PIECES.WHITE_ROOK : PIECES.BLACK_ROOK;
                }
                // Queenside castling
                else {
                    this.board[rank * 16] = PIECES.EMPTY;
                    this.board[rank * 16 + 3] = move.piece === PIECES.WHITE_KING ? PIECES.WHITE_ROOK : PIECES.BLACK_ROOK;
                }
            }
            // Update castling rights
            this.castling = this.castling.replace(move.piece === PIECES.WHITE_KING ? /[KQ]/g : /[kq]/g, '');
        }
        
        // Update castling rights when rook moves or is captured
        if (move.piece === PIECES.WHITE_ROOK || move.captured === PIECES.WHITE_ROOK) {
            if (move.from === 0 || move.to === 0) this.castling = this.castling.replace('Q', '');
            if (move.from === 7 || move.to === 7) this.castling = this.castling.replace('K', '');
        }
        if (move.piece === PIECES.BLACK_ROOK || move.captured === PIECES.BLACK_ROOK) {
            if (move.from === 112 || move.to === 112) this.castling = this.castling.replace('q', '');
            if (move.from === 119 || move.to === 119) this.castling = this.castling.replace('k', '');
        }
        
        // If no castling rights remain, use '-'
        if (this.castling === '') this.castling = '-';
        
        // Update move counters
        if (move.piece === PIECES.WHITE_PAWN || move.piece === PIECES.BLACK_PAWN || move.captured) {
            this.halfMoves = 0;
        } else {
            this.halfMoves++;
        }
        
        if (this.turn === 'b') {
            this.fullMoves++;
        }
        
        // Switch turn
        this.turn = this.turn === 'w' ? 'b' : 'w';
        
        // If the move puts us in check, undo it
        if (this.isInCheck()) {
            this.undoMove();
            return false;
        }
        
        return true;
    }

    public undoMove(): boolean {
        if (this.moveHistory.length === 0) {
            return false;
        }

        const lastState = this.moveHistory.pop()!;
        this.board = lastState.board;
        this.castling = lastState.castling;
        this.enPassant = lastState.enPassant;
        this.halfMoves = lastState.halfMoves;
        this.fullMoves = lastState.fullMoves;
        this.turn = lastState.turn;

        return true;
    }

    private isInCheck(): boolean {
        const kingPiece = this.turn === 'w' ? PIECES.WHITE_KING : PIECES.BLACK_KING;
        let kingSquare = -1;
        
        for (let i = 0; i < 128; i++) {
            if ((i & 0x88) !== 0) continue;
            if (this.board[i] === kingPiece) {
                kingSquare = i;
                break;
            }
        }
        
        if (kingSquare === -1) return false;
        return this.isSquareAttackedBy(kingSquare, this.turn === 'w' ? 'b' : 'w');
    }

    private isSquareAttackedBy(targetSquare: number, attackerColor: 'w' | 'b'): boolean {
        // Check pawn attacks
        const pawnDirection = attackerColor === 'w' ? 16 : -16;
        const attackerPawn = attackerColor === 'w' ? PIECES.WHITE_PAWN : PIECES.BLACK_PAWN;
        
        for (const offset of [-1, 1]) {
            const attackSquare = targetSquare - pawnDirection + offset;
            if ((attackSquare & 0x88) === 0 && this.board[attackSquare] === attackerPawn) {
                return true;
            }
        }

        // Check knight attacks
        const knightOffsets = [-33, -31, -18, -14, 14, 18, 31, 33];
        const attackerKnight = attackerColor === 'w' ? PIECES.WHITE_KNIGHT : PIECES.BLACK_KNIGHT;
        
        for (const offset of knightOffsets) {
            const attackSquare = targetSquare + offset;
            if ((attackSquare & 0x88) === 0 && this.board[attackSquare] === attackerKnight) {
                return true;
            }
        }

        // Check sliding pieces (bishop, rook, queen)
        const directions = [
            [-17, -15, 15, 17], // Bishop directions
            [-16, -1, 1, 16],   // Rook directions
        ];
        
        const attackerBishop = attackerColor === 'w' ? PIECES.WHITE_BISHOP : PIECES.BLACK_BISHOP;
        const attackerRook = attackerColor === 'w' ? PIECES.WHITE_ROOK : PIECES.BLACK_ROOK;
        const attackerQueen = attackerColor === 'w' ? PIECES.WHITE_QUEEN : PIECES.BLACK_QUEEN;

        for (let i = 0; i < directions.length; i++) {
            for (const direction of directions[i]) {
                let square = targetSquare + direction;
                while ((square & 0x88) === 0) {
                    const piece = this.board[square];
                    if (piece !== PIECES.EMPTY) {
                        if ((i === 0 && (piece === attackerBishop || piece === attackerQueen)) ||
                            (i === 1 && (piece === attackerRook || piece === attackerQueen))) {
                            return true;
                        }
                        break;
                    }
                    square += direction;
                }
            }
        }

        // Check king attacks
        const kingOffsets = [-17, -16, -15, -1, 1, 15, 16, 17];
        const attackerKing = attackerColor === 'w' ? PIECES.WHITE_KING : PIECES.BLACK_KING;
        
        for (const offset of kingOffsets) {
            const attackSquare = targetSquare + offset;
            if ((attackSquare & 0x88) === 0 && this.board[attackSquare] === attackerKing) {
                return true;
            }
        }

        return false;
    }

    private isOpponentPiece(piece1: number, piece2: number): boolean {
        return (piece1 <= PIECES.WHITE_KING) !== (piece2 <= PIECES.WHITE_KING);
    }

    public getBestMove(depth: number = 4): Move {
        const moves = this.generateMoves();
        let bestMove = moves[0];
        let bestScore = -Infinity;
        
        for (const move of moves) {
            if (this.makeMove(move)) {
                const score = -this.minimax(depth - 1, -Infinity, Infinity, false);
                this.undoMove();
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }
        
        return bestMove;
    }

    private minimax(depth: number, alpha: number, beta: number, maximizing: boolean): number {
        if (depth === 0) {
            return this.evaluatePosition();
        }
        
        // Check for checkmate or stalemate
        const moves = this.generateMoves();
        if (moves.length === 0) {
            if (this.isInCheck()) {
                return maximizing ? -Infinity : Infinity; // Checkmate
            }
            return 0; // Stalemate
        }
        
        if (maximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                if (this.makeMove(move)) {
                    const evalu = this.minimax(depth - 1, alpha, beta, false);
                    this.undoMove();
                    maxEval = Math.max(maxEval, evalu);
                    alpha = Math.max(alpha, evalu);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                if (this.makeMove(move)) {
                    const evalu = this.minimax(depth - 1, alpha, beta, true);
                    this.undoMove();
                    minEval = Math.min(minEval, evalu);
                    beta = Math.min(beta, evalu);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }

    private evaluatePosition(): number {
        const pieceValues = {
            [PIECES.WHITE_PAWN]: 100,
            [PIECES.WHITE_KNIGHT]: 320,
            [PIECES.WHITE_BISHOP]: 330,
            [PIECES.WHITE_ROOK]: 500,
            [PIECES.WHITE_QUEEN]: 900,
            [PIECES.WHITE_KING]: 20000,
            [PIECES.BLACK_PAWN]: -100,
            [PIECES.BLACK_KNIGHT]: -320,
            [PIECES.BLACK_BISHOP]: -330,
            [PIECES.BLACK_ROOK]: -500,
            [PIECES.BLACK_QUEEN]: -900,
            [PIECES.BLACK_KING]: -20000
        };
        
        let score = 0;
        for (let i = 0; i < 128; i++) {
            if ((i & 0x88) === 0) {
                const piece = this.board[i];
                if (piece !== PIECES.EMPTY) {
                    score += pieceValues[piece];
                }
            }
        }
        
        return score;
    }

    private algebraicTo0x88(algebraic: string): number {
        const file = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(algebraic[1]) - 1;
        return rank * 16 + file;
    }

    private _0x88ToAlgebraic(square: number): string {
        const file = String.fromCharCode('a'.charCodeAt(0) + (square & 7));
        const rank = Math.floor(square / 16) + 1;
        return `${file}${rank}`;
    }
}

// Test Suite for Chess Engine
function runTests() {
    console.log("Starting Chess Engine Tests...\n");

    // Test 1: Initial Position
    function testInitialPosition() {
        console.log("Test 1: Initial Position");
        const chess = new ChessBoard();
        const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const currentFEN = chess.getFEN();
        console.log("Expected:", initialFEN);
        console.log("Got:", currentFEN);
        console.log("Result:", initialFEN === currentFEN ? "PASS" : "FAIL");
        console.log();
    }

    // Test 2: Basic Pawn Move
    function testBasicPawnMove() {
        console.log("Test 2: Basic Pawn Move");
        const chess = new ChessBoard();
        const moves = chess.generateMoves();
        
        // Find e2-e4 move
        const e2e4 = moves.find(move => 
            move.from === chess.algebraicTo0x88("e2") && 
            move.to === chess.algebraicTo0x88("e4")
        );
        
        if (e2e4) {
            chess.makeMove(e2e4);
            const expectedFEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
            const currentFEN = chess.getFEN();
            console.log("Expected:", expectedFEN);
            console.log("Got:", currentFEN);
            console.log("Result:", expectedFEN === currentFEN ? "PASS" : "FAIL");
        } else {
            console.log("Result: FAIL - e2-e4 move not found");
        }
        console.log();
    }

    // Test 3: Move Generation Count
    function testMoveGeneration() {
        console.log("Test 3: Move Generation Count");
        const chess = new ChessBoard();
        const moves = chess.generateMoves();
        const expectedMoveCount = 20; // Initial position has 20 possible moves
        console.log("Expected moves:", expectedMoveCount);
        console.log("Generated moves:", moves.length);
        console.log("Result:", moves.length === expectedMoveCount ? "PASS" : "FAIL");
        console.log();
    }

    // Test 4: AI Basic Test
    function testAI() {
        console.log("Test 4: AI Basic Test");
        const chess = new ChessBoard();
        const bestMove = chess.getBestMove(2); // Depth 2 for quick testing
        console.log("AI suggested move:", 
            `${chess._0x88ToAlgebraic(bestMove.from)}-${chess._0x88ToAlgebraic(bestMove.to)}`
        );
        const isLegalMove = chess.makeMove(bestMove);
        console.log("Is legal move:", isLegalMove);
        console.log("Result:", isLegalMove ? "PASS" : "FAIL");
        console.log();
    }

    // Test 5: Check Detection
    function testCheckDetection() {
        console.log("Test 5: Check Detection");
        // Set up scholar's mate position
        const chess = new ChessBoard();
        chess.loadFEN("rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2");
        const isInCheck = chess.isInCheck();
        console.log("Position:", chess.getFEN());
        console.log("Expected check:", false);
        console.log("Detected check:", isInCheck);
        console.log("Result:", isInCheck === false ? "PASS" : "FAIL");
        console.log();
    }

    // Run all tests
    testInitialPosition();
    testBasicPawnMove();
    testMoveGeneration();
    testAI();
    testCheckDetection();
}

// Run the test suite
runTests();