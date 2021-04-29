/* 
 * The main JS file, contains functions that deal with the board, user interaction, and UI elements.
 * Many funcions altered from original by me
 */

var STACK_SIZE = 50; // maximum size of undo stack

var board = null
var $board = $('#myBoard')
var game = new Chess()

var globalSum = 0 // always from black's perspective. Negative for white's perspective.

var positionCount;

var config = {
    draggable: true,
    position: 'start',
}
board = Chessboard('myBoard', config)

timer = null;

//Starts AI vs "Random" game
$('#startBtn').on('click', function() {
    reset();
    compVsComp('w')
})

function reset() {
    game.reset();
    globalSum = 0;
    board.position(game.fen());
    $('#advantageColor').text('Neither side');
    $('#advantageNumber').text(globalSum);

    // Kill the Computer vs. Computer callback
    if (timer)
    {
        clearTimeout(timer);
        timer = null;
    }
}

//Resets AI vs "Random" game
$('#resetBtn').on('click', function() {
    reset();
})

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

// AI1 BELOW -----

/* 
 * Makes the best legal move for the given color.
 * Modified by me
 */
function makeBestMove(color) {
    
    console.log("making move for", color)
    if (color === 'b') {
        var move = getBestMove(game, color, globalSum)[0];
    } else {
        var random = Math.floor(Math.random() * 10);
        if (random < 7) {
            var move = getNonOptimalMove("w");
        } else {
            var move = getRandomMove();
        }
    }
    
    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();

    game.move(move);
    board.position(game.fen());
}

function compVsComp(color) {
    if (!checkStatus({'w': 'white', 'b': 'black'}[color]))
    {
        timer = window.setTimeout(function () {
            makeBestMove(color);
            if (color === 'w') {color = 'b'}
            else {color = 'w'}
            compVsComp(color);   
        }, 500);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomMove() {
    console.log("random move for white");
    var children = game.ugly_moves({verbose: true});
    var random = Math.floor(Math.random() * children.length);
    var move = game.ugly_move(children[random]);
    return move;
}

//Used in AI2, needs to have a method here to avoid error
//"Written" by me
function fudgeEvaluation(sum) {
    return sum;
}

//"random" opponent below -------------------------

//Essentially makes a move with depth 1, this way it wont make an inherently bad initial move,
//But will almost certainly not make optimal moves, allowing the player to catch up.
//Written by me
function getNonOptimalMove(color) {
    var children = game.ugly_moves({verbose: true});
    var bestMove = null
    var bestMoveValue = Number.NEGATIVE_INFINITY;
    //Checking each possible move to see its evaluation, and finds the highest evaluated move
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