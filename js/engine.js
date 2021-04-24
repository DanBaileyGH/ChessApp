//Main chess engine / ai file. Contains methods that deal with logic / evaluation
//Many methods altered from original by me.
var globalDepth = 4


//Altered weights from page at https://www.chessprogramming.org/Simplified_Evaluation_Function
//As original weights caused some strange moves that were not ideal
var weights = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 60000, 'k_e': 60000 };

//Piece square tables for all pieces, modified by me as original values caused odd moves (only moving knights at start of game etc)
var pst_w = {
    'p':[
            [  0,  0,  0,  0,  0,  0,  0,  0],
            [  50, 50, 50, 50, 50, 50, 50, 50],
            [  10, 10, 20, 30, 30, 20, 10, 10],
            [  5,  5, 10, 25, 25, 10,  5,  5],
            [  0,  0,  0, 20, 20,  0,  0,  0],
            [  5, -5,-10, -5, -5,-10, -5,  5],
            [  5,  0,  0,-30,-30,  0,  0,  5],
            [  0,  0,  0,  0,  0,  0,  0,  0]
        ],
    'n': [ 
            [-50,-40,-20,-25,-25,-20,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-25,-25,-25,-25,-40,-50]
        ],
    'b': [ 
            [-20,-15,-15,-10,-10,-15,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-15,-10,-10,-15,-10,-20]
        ],
    'r': [  
            [0,  0,  0,  0,  0,  0,   0,  0],
            [5, 10, 10, 10, 10, 10,   10, 5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,   0,  0,  5,  5,  0,  0,  0]
        ],
    'q': [   
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,   0,  5,  5,  5,  5,  0, -5],
            [0,    0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
    'k': [  
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20,  20,  0,  0,  0,  0, 20, 20],
            [20, 30,  10,  0,  0, 10, 30, 20]
        ],

    // Endgame King Table
    'k_e': [
            [-50, -40, -30, -20, -20, -30, -40, -50],
            [-30, -20, -10,   0,   0, -10, -20, -30],
            [-30, -10,  20,  30,  30,  20, -10, -30],
            [-30, -10,  30,  40,  40,  30, -10, -30],
            [-30, -10,  30,  40,  40,  30, -10, -30],
            [-30, -10,  20,  30,  30,  20, -10, -30],
            [-30, -30,   0,   0,   0,   0, -30, -30],
            [-50, -30, -30, -30, -30, -30, -30, -50]
        ]
};

//black piece square tables are whites reversed
var pst_b = {
    'p': pst_w['p'].slice().reverse(),
    'n': pst_w['n'].slice().reverse(),
    'b': pst_w['b'].slice().reverse(),
    'r': pst_w['r'].slice().reverse(),
    'q': pst_w['q'].slice().reverse(),
    'k': pst_w['k'].slice().reverse(),
    'k_e': pst_w['k_e'].slice().reverse()
}

var pstOpponent = {'w': pst_b, 'b': pst_w};
var pstSelf = {'w': pst_w, 'b': pst_b};

/* 
 * Evaluates the board at this point in time, 
 * using the material weights and piece square tables.
 */
function evaluateBoard (move, prevSum, color) {
    try {
        var from = [8 - parseInt(move.from[1]), move.from.charCodeAt(0) - 'a'.charCodeAt(0)];
        var to = [8 - parseInt(move.to[1]), move.to.charCodeAt(0) - 'a'.charCodeAt(0)];
    } catch (error) {
        //invalid move inputted
        //this should stop the game from switching sides when this error happens
        console.log("switch sides bug caused by passing in this to evaluate function:", move)
        return prevSum;
    }
    
    // Change endgame behavior for kings
    if (prevSum < -1500) {
        if (move.piece === 'k') {move.piece = 'k_e'}
        else if (move.captured === 'k') {move.captured = 'k_e'}
    }

    if ('captured' in move) {
        if (move.color === color) { // Opponent piece was captured (good for us)
            prevSum += (weights[move.captured] + pstOpponent[move.color][move.captured][to[0]][to[1]]);
        } else { // Our piece was captured (bad for us)
            prevSum -= (weights[move.captured] + pstSelf[move.color][move.captured][to[0]][to[1]]);
        }
    }

    if (move.flags.includes('p')) {
        //Automatically promotes to queen for simplicity
        move.promotion = 'q';
        if (move.color === color) { 
            //Our piece was promoted (good for us)
            prevSum -= (weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]]);
            prevSum += (weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]]);
        } else {
            //Opponent piece was promoted (bad for us)
            prevSum += (weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]]);
            prevSum -= (weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]]);
        }
    }
    else {
        //The moved piece still exists on the updated board, so we only need to update the position value
        if (move.color !== color) {
            prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
        }
        else {
            prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
        }
    }
    return prevSum;
}

/*
 * Applies minimax algorithm with alpha-beta pruning at a set depth (normally 4 moves due to computation time)
 * Some functionality altered by me as original version lacked any checks for checkmates/draws, which lead
 * to the bot missing mates and moving into stalemates from far ahead.
 * Modified by me.
 */
function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color, currPrettyMove)
{
    positionCount++; 
    var children = game.ugly_moves({verbose: true});
    
    var currMove;
    
    //Maximum depth exceeded or node is a terminal node (no children)
    if (depth === 0 || children.length === 0) {
        if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
            //Check if move leads to a draw, if it does give it value of 0
            return [currPrettyMove, 0];
        } else if (game.in_checkmate()) {
            if (isMaximizingPlayer) {
                //Check if move leads to a checkmate, gives it very high or very low value depending on side
                return [currPrettyMove, -1000000];
            } else {
                return [currPrettyMove, 10000000 / (globalDepth-depth)];
                //Cant return infinity as it treats mate in 1 same as mate in 2, this just takes the mate in 1
            }
        } else {
            return [null, sum]
        }   
    }
    
    //Find maximum/minimum from list of 'children' (possible moves)
    var maxValue = Number.NEGATIVE_INFINITY;
    var minValue = Number.POSITIVE_INFINITY;
    var bestMove;
    for (var i = 0; i < children.length; i++) {
        currMove = children[i];

        //Note: in our case, the 'children' are simply modified game states
        var currPrettyMove = game.ugly_move(currMove);
        var newSum = evaluateBoard(currPrettyMove, sum, color);

        //Finds best move of possible children
        var [childBestMove, childValue] = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer, newSum, color, currPrettyMove);
        
        game.undo();
    
        if (isMaximizingPlayer) {
            if (childValue > maxValue) {
                maxValue = childValue;
                bestMove = currPrettyMove;
            } 
            
            if (childValue > alpha) {
                alpha = childValue;
            }
        } else {
            if (childValue < minValue) {
                minValue = childValue;
                bestMove = currPrettyMove;
            }
            
            if (childValue < beta) {
                beta = childValue;
            }
        }

        // Alpha-beta pruning
        if (alpha >= beta) {
            break;
        }
    }

    if (isMaximizingPlayer) {
        return [bestMove, maxValue]
    } else {
        return [bestMove, minValue];
    }
}

/*
 * Gets the best move for the AI side using the minimax function and returns the move and its value.
 * Slightly modified by me to reduce the number of super long turns the bot takes.
 */
function getBestMove (game, color, currSum) {

    positionCount = 0;
    var d = new Date().getTime();

    var possibleMoves = game.moves();
    console.log(possibleMoves.length)

    if (possibleMoves.length < 35) { //trying to remove 45s+ turns
        var [bestMove, bestMoveValue] = minimax(game, globalDepth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true, currSum, color, null);
    } else {
        var [bestMove, bestMoveValue] = minimax(game, (globalDepth-1), Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true, currSum, color, null);
    }

    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = (positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    if(positionCount > 100000){
        $('#position-count').css("font-weight", "bold");
    } else {
        $('#position-count').css("font-weight", "normal")
    }
    
    $('#time').text(moveTime/1000);
    $('#positions-per-s').text(Math.round(positionsPerS));

    return [bestMove, bestMoveValue];
}
