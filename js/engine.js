/* 
 * Altered weights, based on page at https://www.chessprogramming.org/Simplified_Evaluation_Function
 */

var weights = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 60000, 'k_e': 60000 };
var pst_w = {
    'p':[
            [  0,  0,  0,  0,  0,  0,  0,  0],
            [  50, 50, 50, 50, 50, 50, 50, 50],
            [  10, 10, 20, 30, 30, 20, 10, 10],
            [  5,  5, 10, 25, 25, 10,  5,  5],
            [  0,  0,  0, 20, 20,  0,  0,  0],
            [  5, -5,-10,  0,  0,-10, -5,  5],
            [  5, 10, 10,-20,-20, 10, 10,  5],
            [  0, 0, 0, 0, 0, 0, 0, 0]
        ],
    'n': [ 
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
    'b': [ 
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
    'r': [  
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
    'q': [   
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
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
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
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
function evaluateBoard (move, prevSum, color) 
{
    var from = [8 - parseInt(move.from[1]), move.from.charCodeAt(0) - 'a'.charCodeAt(0)];
    var to = [8 - parseInt(move.to[1]), move.to.charCodeAt(0) - 'a'.charCodeAt(0)];

    // Change endgame behavior for kings
    if (prevSum < -1500)
    {
        if (move.piece === 'k') {move.piece = 'k_e'}
        else if (move.captured === 'k') {move.captured = 'k_e'}
    }

    if ('captured' in move)
    {
        // Opponent piece was captured (good for us)
        if (move.color === color)
        {
            prevSum += (weights[move.captured] + pstOpponent[move.color][move.captured][to[0]][to[1]]);
        }
        // Our piece was captured (bad for us)
        else
        {
            prevSum -= (weights[move.captured] + pstSelf[move.color][move.captured][to[0]][to[1]]);
        }
    }

    if (move.flags.includes('p'))
    {
        // NOTE: promote to queen for simplicity
        move.promotion = 'q';

        // Our piece was promoted (good for us)
        if (move.color === color)
        {
            prevSum -= (weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]]);
            prevSum += (weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]]);
        }
        // Opponent piece was promoted (bad for us)
        else
        {
            prevSum += (weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]]);
            prevSum -= (weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]]);
        }
    }
    else
    {
        // The moved piece still exists on the updated board, so we only need to update the position value
        if (move.color !== color)
        {
            prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
        }
        else
        {
            prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
            prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
        }
    }
    
    return prevSum;
}

/*
 * Performs the minimax algorithm to choose the best move: https://en.wikipedia.org/wiki/Minimax (pseudocode provided)
 * Recursively explores all possible moves up to a given depth, and evaluates the game board at the leaves.
 * 
 * Basic idea: maximize the minimum value of the position resulting from the opponent's possible following moves.
 * Optimization: alpha-beta pruning: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning (pseudocode provided)
 * 
 * Inputs:
 *  - game:                 the game object.
 *  - depth:                the depth of the recursive tree of all possible moves (i.e. height limit).
 *  - isMaximizingPlayer:   true if the current layer is maximizing, false otherwise.
 *  - sum:                  the sum (evaluation) so far at the current layer.
 *  - color:                the color of the current player.
 * 
 * Output:
 *  the best move at the root of the current subtree.
 */
function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color)
{
    positionCount++; 
    var children = game.ugly_moves({verbose: true});
    
    // Sort moves randomly, so the same move isn't always picked on ties
    children.sort(function(a, b){return 0.5 - Math.random()});
    
    var currMove;
    // Maximum depth exceeded or node is a terminal node (no children)
    if (depth === 0 || children.length === 0)
    {
        return [null, sum]
    }

    // Find maximum/minimum from list of 'children' (possible moves)
    var maxValue = Number.NEGATIVE_INFINITY;
    var minValue = Number.POSITIVE_INFINITY;
    var bestMove;
    for (var i = 0; i < children.length; i++)
    {
        currMove = children[i];

        // Note: in our case, the 'children' are simply modified game states
        var currPrettyMove = game.ugly_move(currMove);
        var newSum = evaluateBoard(currPrettyMove, sum, color);
        var [childBestMove, childValue] = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer, newSum, color);
        
        game.undo();
    
        if (isMaximizingPlayer)
        {
            if (childValue > maxValue)
            {
                maxValue = childValue;
                bestMove = currPrettyMove;
            }
            if (childValue > alpha)
            {
                alpha = childValue;
            }
        }

        else
        {
            if (childValue < minValue)
            {
                minValue = childValue;
                bestMove = currPrettyMove;
            }
            if (childValue < beta)
            {
                beta = childValue;
            }
        }

        // Alpha-beta pruning
        if (alpha >= beta)
        {
            break;
        }
    }

    if (isMaximizingPlayer)
    {
        return [bestMove, maxValue]
    }
    else
    {
        return [bestMove, minValue];
    }
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
