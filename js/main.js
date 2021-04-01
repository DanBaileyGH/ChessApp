/* 
 * A simple chess AI, by someone who doesn't know how to play chess.
 * Uses the chessboard.js and chess.js libraries.
 * 
 * Copyright (c) 2020 Zhang Zeyu
 */

var STACK_SIZE = 50;                 // maximum size of undo stack

var board = null
var $board = $('#myBoard')
var game = new Chess()
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

function checkStatus (color) {

    console.log(`checking status for ${color}`);

    if (game.in_checkmate())
    {
        $('#status').html(`<b>Checkmate!</b> Oops, <b>${color}</b> lost.`);
    }
    else if (game.insufficient_material())
    {
        $('#status').html(`It's a <b>draw!</b> (Insufficient Material)`);
    }
    else if (game.in_threefold_repetition())
    {
        $('#status').html(`It's a <b>draw!</b> (Threefold Repetition)`);
    }
    else if (game.in_stalemate())
    {
        $('#status').html(`It's a <b>draw!</b> (Stalemate)`);
    }
    else if (game.in_draw())
    {
        $('#status').html(`It's a <b>draw!</b> (50-move Rule)`);
    }
    else if (game.in_check())
    {
        $('#status').html(`Oops, <b>${color}</b> is in <b>check!</b>`);
        return false;
    }
    else
    {
        $('#status').html(`No check, checkmate, or draw.`)
        return false;
    }
    return true;
}

function updateAdvantage()
{
    if (globalSum > 0)
    {
        $('#advantageColor').text('Black');
        $('#advantageNumber').text(globalSum);
    }
    else if (globalSum < 0)
    {
        $('#advantageColor').text('White');
        $('#advantageNumber').text(-globalSum);
    }
    else
    {
        $('#advantageColor').text('Neither side');
        $('#advantageNumber').text(globalSum);
    }
    $('#advantageBar').attr({
        "aria-valuenow": `${-globalSum}`,
        style: `width: ${(-globalSum + 2000) / 4000 * 100}%`,
    });
}

/*
 * Calculates the best legal move for the given color.
 */
function getBestMove (game, color, currSum) {

    positionCount = 0;
    
    var depth = 4;

    var d = new Date().getTime();
    var [bestMove, bestMoveValue] = minimax(game, depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true, currSum, color);
    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = (positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    $('#time').text(moveTime/1000);
    $('#positions-per-s').text(Math.round(positionsPerS));

    return [bestMove, bestMoveValue];
}

/* 
 * Makes the best legal move for the given color.
 */
function makeBestMove(color) {
    if (color === 'b')
    {
        var move = getBestMove(game, color, globalSum)[0];
    }
    else
    {
        var move = getBestMove(game, color, -globalSum)[0];
    }

    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();

    game.move(move);
    board.position(game.fen());

    if (color === 'b')
    {
        console.log("b");
        checkStatus('black');

        // Highlight black move
        $board.find('.' + squareClass).removeClass('highlight-black')
        $board.find('.square-' + move.from).addClass('highlight-black')
        squareToHighlight = move.to
        colorToHighlight = 'black'

        $board.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)
    }
    else
    {
        console.log("w");
        checkStatus('white');

        // Highlight white move
        $board.find('.' + squareClass).removeClass('highlight-white')
        $board.find('.square-' + move.from).addClass('highlight-white')
        squareToHighlight = move.to
        colorToHighlight = 'white'

        $board.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)
    }
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

$('#resetBtn').on('click', function() {
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
            window.setTimeout(function () {showHint()}, 250)
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
            window.setTimeout(function () {showHint()}, 250)
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

    if (!checkStatus('black'));
    {
        console.log("a");
        // Make the best move for black
        window.setTimeout(function() {
            makeBestMove('b');
            window.setTimeout(function() {
                showHint();
            }, 250);
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