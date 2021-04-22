/* 
 * A simple chess AI.
 * Uses the chessboard.js and chess.js libraries.
 * 
 * Modified From Original Code 2020 Zhang Zeyu
 */

var STACK_SIZE = 50; // maximum size of undo stack

var board = null
var $board = $('#myBoard')
var game = new Chess()

var globalSum = 0 // always from black's perspective. Negative for white's perspective.
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'
var squareClass = 'square-55d63'
var squareToHighlight = null
var colorToHighlight = null
var positionCount;

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
}
board = Chessboard('myBoard', config)

timer = null;

var nextBtn = document.getElementById("nextBtn");
nextBtn.style.visibility = "hidden";

var gameEndTxt = document.getElementById("gameOver");

/* 
 * Makes the best legal move for the given color.
 */
function makeBestMove(color) {

    if (color === 'b') {
        var [move, moveValue] = getBestMove(game, color, globalSum);
    } else {
        var move = getBestMove(game, color, -globalSum)[0];
    }

    //artificial stupidity
    if (moveValue < 10000) { 
        //bot doesnt miss forced mate in 2s while ahead, avoids frustration with getting stuck on just your king
        var random = Math.floor(Math.random() * globalSum);
        if (globalSum > 300 && !(random > (globalSum - 250))) { 
            //random chance of worse move, only when bot is fairly ahead, more likely the more ahead
            move = getNonOptimalMove(color);
        }
    }
    
    game.move(move);
    board.position(game.fen());
    
    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();
    checkStatus('white');

    // Highlight black move
    try{
        $board.find('.' + squareClass).removeClass('highlight-black')
        $board.find('.square-' + move.from).addClass('highlight-black')
        squareToHighlight = move.to
        colorToHighlight = 'black'
    
        $board.find('.square-' + squareToHighlight)
            .addClass('highlight-' + colorToHighlight)
    } catch (error) {
        //sometimes this breaks, dont have time to figure out why
        console.log("switch sides bug error caught in makebestmove function")
        console.log("move that caused bug:", move)
    }

    if (game.in_checkmate() || game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
        nextBtn.style.visibility = "visible";
        if (game.in_checkmate()) {
            gameEndTxt.innerHTML = "Unlucky Loss!"
        } else {
            gameEndTxt.innerHTML = "Nice Draw!"
        }
    } else {
        $('#new').text("Your Move!");
    }
}

//Essentially makes a move with depth 1, this way it wont make an inherently bad initial move,
//but will almost certainly not make optimal moves, allowing the player to catch up.
function getNonOptimalMove(color) {
    console.log("made non optimal move");
    var children = game.ugly_moves({verbose: true});
    var bestMove = null
    var bestMoveValue = Number.NEGATIVE_INFINITY;
    for (var i = 0; i < children.length; i++) {
        currMove = children[i];
        var currPrettyMove = game.ugly_move(currMove);
        var value = evaluateBoard(currPrettyMove, globalSum, color);
        if (value > bestMoveValue){
            bestMove = currPrettyMove;
            bestMoveValue = value;
        }
        game.undo();
    }
    return bestMove;
}

/*
 * Resets the game to its initial state.
 */
function reset() {
    game.reset();
    globalSum = 0;
    $board.find('.' + squareClass).removeClass('highlight-white');
    $board.find('.' + squareClass).removeClass('highlight-black');
    $board.find('.' + squareClass).removeClass('highlight-hint')
    board.position(game.fen());
    $('#advantageColor').text('Neither side');
    $('#advantageNumber').text(globalSum);

    // Kill the callback
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}

$('#startBtn').on('click', function () {
    reset();
})

var undo_stack = [];

function undo() {
    var move = game.undo();
    undo_stack.push(move);

    // Maintain a maximum stack size
    if (undo_stack.length > STACK_SIZE) {
        undo_stack.shift();
    }
    board.position(game.fen());
}

$('#undoBtn').on('click', function () {
    if (game.history().length >= 2) {
        $board.find('.' + squareClass).removeClass('highlight-white');
        $board.find('.' + squareClass).removeClass('highlight-black');
        $board.find('.' + squareClass).removeClass('highlight-hint');

        // Undo twice: Opponent's latest move, followed by player's latest move
        undo();
        window.setTimeout(function () {
            undo();
        }, 250);
    } else {
        alert("Nothing to undo.");
    }
})

function redo() {
    game.move(undo_stack.pop());
    board.position(game.fen());
}

$('#redoBtn').on('click', function () {
    if (undo_stack.length >= 2) {
        // Redo twice: Player's last move, followed by opponent's last move
        redo();
        window.setTimeout(function () {
            redo();
        }, 250);
    } else {
        alert("Nothing to redo.");
    }
})

/* 
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */
function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '')
}

function greySquare(square) {
    var $square = $('#myBoard .square-' + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }

    $square.css('background', background)
}

function onDragStart(source, piece) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // or if it's not that side's turn
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop(source, target) {
    undo_stack = [];
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })

    // Illegal move
    if (move === null) return 'snapback'

    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();

    // Highlight latest move
    $board.find('.' + squareClass).removeClass('highlight-white')

    $board.find('.square-' + move.from).addClass('highlight-white')
    squareToHighlight = move.to
    colorToHighlight = 'white'

    $board.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)

    $('#new').text("Thinking...");

    if (!checkStatus("black")) {
        // Make the best move for black
        window.setTimeout(function () {
            makeBestMove('b');
        }, 250)
    }

    if (game.in_checkmate() || game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()){
        nextBtn.style.visibility = "visible";
        if(game.in_checkmate()) {
            gameEndTxt.innerHTML = "Nice Win!"
        } else {
            gameEndTxt.innerHTML = "Nice Draw!"
        }
    }
}

function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    })

    // exit if there are no moves available for this square
    if (moves.length === 0) return

    // highlight the square they moused over
    greySquare(square)

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to)
    }
}

function onMouseoutSquare(square, piece) {
    removeGreySquares()
}

function onSnapEnd() {
    board.position(game.fen())
}