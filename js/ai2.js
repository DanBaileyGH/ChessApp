
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
        if (globalSum > 300 && !(random > (globalSum - 200))) { 
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
