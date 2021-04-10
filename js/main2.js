/* 
 * A simple chess AI, by someone who doesn't know how to play chess.
 * Uses the chessboard.js and chess.js libraries.
 * 
 * Original Code 2020 Zhang Zeyu
 */

var STACK_SIZE = 50;                 // maximum size of undo stack

var board = null
var $board = $('#myBoard')
var game = new Chess()

//testing checking checkmate/draw
fakegame = null;

var globalSum = 0                     // always from black's perspective. Negative for white's perspective.
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

/* 
 * Makes the best legal move for the given color.
 */
function makeBestMove(color) {

    console.log("current globalsum:", globalSum);

    if (color === 'b')
    {
        var move = getBestMove(game, color, globalSum)[0];
    }
    else
    {
        var move = getBestMove(game, color, -globalSum)[0];
    }
    
    var random = Math.floor(Math.random() * globalSum);
    console.log("random num:", random);
    if (globalSum > 300 && !(random > (globalSum-250))){ //TODO: rethink formula for this
        console.log("made random move");
        move = makeRandomMove();
        console.log(move);
    } else {
        game.move(move);
        board.position(game.fen());
    }

    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();
    checkStatus('white');

    // Highlight black move
    $board.find('.' + squareClass).removeClass('highlight-black')
    $board.find('.square-' + move.from).addClass('highlight-black')
    squareToHighlight = move.to
    colorToHighlight = 'black'

    $board.find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight)
}

function makeRandomMove () {

    var children = game.ugly_moves({verbose: true});
    children.sort(function(a, b){return 0.5 - Math.random()});
    currMove = children[1];
    var currPrettyMove = game.ugly_move(currMove);
    game.move(currPrettyMove);
    
    /*
    var possibleMoves = game.moves();
    var randomIdx = Math.floor(Math.random() * possibleMoves.length);
    randMove = possibleMoves[randomIdx];
    game.move(randMove);
    */
    board.position(game.fen());
    return currPrettyMove;
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
    if (timer)
    {
        clearTimeout(timer);
        timer = null;
    }
}

$('#startBtn').on('click', function() {
    reset();
})

var undo_stack = [];

function undo()
{
    var move = game.undo();
    undo_stack.push(move);

    // Maintain a maximum stack size
    if (undo_stack.length > STACK_SIZE)
    {
        undo_stack.shift();
    }
    board.position(game.fen());
}

$('#undoBtn').on('click', function() {

    if (game.history().length >= 2)
    {
        $board.find('.' + squareClass).removeClass('highlight-white');
        $board.find('.' + squareClass).removeClass('highlight-black');
        $board.find('.' + squareClass).removeClass('highlight-hint');

        // Undo twice: Opponent's latest move, followed by player's latest move
        undo();
        window.setTimeout(function() {
            undo();
        }, 250);
    }
    else
    {
        alert("Nothing to undo.");
    }  
})

function redo()
{
    game.move(undo_stack.pop());
    board.position(game.fen());
}

$('#redoBtn').on('click', function() {

    if (undo_stack.length >= 2)
    {
        // Redo twice: Player's last move, followed by opponent's last move
        redo();
        window.setTimeout(function(){
            redo();
        }, 250);
    }
    else
    {
        alert("Nothing to redo.");
    }
})

/* 
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */
function removeGreySquares () {
    $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
    var $square = $('#myBoard .square-' + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }

    $square.css('background', background)
}

function onDragStart (source, piece) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // or if it's not that side's turn
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop (source, target) {
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

    if (!checkStatus("black"));
    {
        // Make the best move for black
        window.setTimeout(function() {
            makeBestMove('b');
        }, 250)
    } 
}

function onMouseoverSquare (square, piece) {
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

function onMouseoutSquare (square, piece) {
    removeGreySquares()
}

function onSnapEnd () {
    board.position(game.fen())
}