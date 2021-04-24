/* 
 * The main JS file, contains functions that deal with the board, user interaction, and UI elements.
 * Many funcions altered from original by me
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

//Button that shows when game is over to take user to next game (if doing guided version)
var nextBtn = document.getElementById("nextBtn");
if (nextBtn != null){
    nextBtn.style.visibility = "hidden";
}

//Text to say "nice win" or "unfortunate loss" at end of game
var gameEndTxt = document.getElementById("gameOver");

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

    //Resets timer (unused in this version)
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}

//Resets board if user clicks start position button
$('#startBtn').on('click', function() {
    reset();
})

var undo_stack = [];

//Undoes the last move on the undo stack and updates the board
function undo() {
    var move = game.undo();
    undo_stack.push(move);

    //Maintain a maximum stack size
    if (undo_stack.length > STACK_SIZE) {
        undo_stack.shift();
    }
    board.position(game.fen());
}

//When undo button is pressed, removes square highlighting and undoes last move
$('#undoBtn').on('click', function() {
    if (game.history().length >= 2) {
        $board.find('.' + squareClass).removeClass('highlight-white');
        $board.find('.' + squareClass).removeClass('highlight-black');
        $board.find('.' + squareClass).removeClass('highlight-hint');

        //Undo twice: Opponent's latest move, followed by player's latest move
        undo();
        window.setTimeout(function() {
            undo();
        }, 250);
    } else {
        alert("Nothing to undo.");
    }
})

//Reapplies the last undone move, updates board
function redo() {
    game.move(undo_stack.pop());
    board.position(game.fen());
}

//When redo button is pressed, redoes last move
$('#redoBtn').on('click', function() {
    if (undo_stack.length >= 2) {
        //Redo twice: Player's last move, followed by opponent's last move
        redo();
        window.setTimeout(function(){
            redo();
        }, 250);
    } else {
        alert("Nothing to redo.");
    }
})

//Removes all grey squares (used to indicate where the player can move)
function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '')
}

//Greys a square (used to indicate where the player can move)
function greySquare(square) {
    var $square = $('#myBoard .square-' + square)
    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }
    $square.css('background', background)
}

//When the user tries to pick up the piece, stop the user if it is not their turn or game is over
function onDragStart(source, piece) {
    //Do not pick up pieces if the game is over
    if (game.game_over()) return false

    //Or if it's not that side's turn
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

//When the user moves a piece, check the move, make it, check for checkmate / draw, call next ai move
//Modified by me
function onDrop(source, target) {
    undo_stack = [];
    removeGreySquares();

    //See if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' //Always promote to a queen for simplicity
    })

    //Illegal move
    if (move === null) return 'snapback'
    
    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();

    //Highlight latest move
    $board.find('.' + squareClass).removeClass('highlight-white')
    
    $board.find('.square-' + move.from).addClass('highlight-white')
    squareToHighlight = move.to
    colorToHighlight = 'white'

    $board.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)

    //Indicate to user that the bot is thinking about next move
    $('#new').text("Thinking...");

    if (!checkStatus("black")) {
        //Make the best move for black
        window.setTimeout(function() {
            makeBestMove('b');
        }, 250)
    } 

    //If game is over, show button to go to next game and show message congratulating player
    if (game.in_checkmate() || game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()){
        if (nextBtn != null){
            nextBtn.style.visibility = "visible";
        } if(game.in_checkmate()) {
            gameEndTxt.innerHTML = "Nice Win!"
            $('#new').text("Nice Win!");
        } else {
            gameEndTxt.innerHTML = "Nice Draw!"
            $('#new').text("Nice Draw!");
        }
    }
}

//When hovering on a piece, show possible moves
function onMouseoverSquare(square, piece) {
    //Get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    })

    //Exit if there are no moves available for this square
    if (moves.length === 0) return

    //Highlight the square they moused over
    greySquare(square)

    //Highlight the possible squares for this piece
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

//Checks status of game (in check, draw, etc)
function checkStatus (color) {

    if (game.in_checkmate()) {
        $('#status').html(`<b>Checkmate!</b> Oops, <b>${color}</b> lost.`);
    } else if (game.insufficient_material()) {
        $('#status').html(`It's a <b>draw!</b> (Insufficient Material)`);
    } else if (game.in_threefold_repetition()) {
        $('#status').html(`It's a <b>draw!</b> (Threefold Repetition)`);
    } else if (game.in_stalemate()) {
        $('#status').html(`It's a <b>draw!</b> (Stalemate)`);
    } else if (game.in_draw()) {
        $('#status').html(`It's a <b>draw!</b> (50-move Rule)`);
    } else if (game.in_check()) {
        $('#status').html(`Oops, <b>${color}</b> is in <b>check!</b>`);
        return false;
    } else {
        $('#status').html(`No check, checkmate, or draw.`)
        return false;
    }
    return true;
}

//Updates advantage bar with who is currently leading according to bot evaluation
function updateAdvantage() {
    if (globalSum > 0) {
        $('#advantageColor').text('Black');
        $('#advantageNumber').text(globalSum);
    } else if (globalSum < 0) {
        $('#advantageColor').text('White');
        $('#advantageNumber').text(-globalSum);
    } else {
        $('#advantageColor').text('Neither side');
        $('#advantageNumber').text(globalSum);
    }

    $('#advantageBar').attr({
        "aria-valuenow": `${-globalSum}`,
        style: `width: ${(-globalSum + 2000) / 4000 * 100}%`,
    });
}
