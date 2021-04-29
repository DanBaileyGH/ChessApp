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

// AI2 BELOW -----


/* 
 * Makes the "best" legal move for the given color.
 * Will not always make best move as this function adds a couple methods of artificial stupidity 
 * Modified by me
 */
function makeBestMove(color) {

    if (color === 'b') {
        var [move, moveValue] = getBestMove(game, color, globalSum);
    } else {
        var move = getNonOptimalMove("w");
    }

    //Artificial stupidity
    if (moveValue < 10000 && color === 'b') { 
        //Bot doesnt miss forced mate in 2s while ahead, avoids frustration with getting stuck on just your king
        var random = Math.floor(Math.random() * globalSum);
        if (globalSum > 300 && !(random > (globalSum - 200))) { 
            //Random chance of worse move, only when bot is fairly ahead, more likely the more ahead
            console.log("non optimal move for black")
            move = getNonOptimalMove(color);
        }
    }
    //Note: evaluation wont always be correct due to evaluation fudging for moves, but should never stray too far off of correct
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

function getRandomMove() {
    var children = game.ugly_moves({verbose: true});
    var random = Math.floor(Math.random() * children.length);
    var move = game.ugly_move(children[random]);
    return move;
}

//Slightly "fudges" the move evaluation for AI 2 to add some more random artificial stupidity to the bot
//Written by me
function fudgeEvaluation(sum) {
    var random = Math.floor(Math.random() * 20) - 10;
    return (sum + random)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}