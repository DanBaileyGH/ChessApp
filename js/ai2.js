
/* 
 * Makes the "best" legal move for the given color.
 * Will not always make best move as this function adds a couple methods of artificial stupidity 
 * Modified by me
 */
function makeBestMove(color) {

    if (color === 'b') {
        var [move, moveValue] = getBestMove(game, color, globalSum);
    } else {
        var move = getBestMove(game, color, -globalSum)[0];
    }

    //Artificial stupidity
    if (moveValue < 10000) { 
        //Bot doesnt miss forced mate in 2s while ahead, avoids frustration with getting stuck on just your king
        var random = Math.floor(Math.random() * globalSum);
        if (globalSum > 300 && !(random > (globalSum - 200))) { 
            //Random chance of worse move, only when bot is fairly ahead, more likely the more ahead
            move = getNonOptimalMove(color);
        }
    }
    
    game.move(move);
    board.position(game.fen());

    //Note: evaluation wont always be correct due to evaluation fudging for moves, but should never stray too far off of correct
    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();
    checkStatus('white');

    //Highlight black move
    try{
        $board.find('.' + squareClass).removeClass('highlight-black')
        $board.find('.square-' + move.from).addClass('highlight-black')
        squareToHighlight = move.to
        colorToHighlight = 'black'
    
        $board.find('.square-' + squareToHighlight)
            .addClass('highlight-' + colorToHighlight)
    } catch (error) {
        //sometimes an incorrect function call can result in the player switching to the black pieces, this is for debugging this
        console.log("switch sides bug error caught in makebestmove function")
        console.log("move that caused bug:", move)
    }

    //checking if game is over, updating status
    if (game.in_checkmate() || game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
        if (nextBtn != null){
            nextBtn.style.visibility = "visible";
        } if (game.in_checkmate()) {
            gameEndTxt.innerHTML = "Unlucky Loss!"
        } else {
            gameEndTxt.innerHTML = "Nice Draw!"
        }
    } else {
        $('#new').text("Your Move!");
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

//Slightly "fudges" the move evaluation for AI 2 to add some more random artificial stupidity to the bot
//Written by me
function fudgeEvaluation(sum) {
    random = Math.floor(Math.random() * 20) - 10;
    return (sum + random)
}