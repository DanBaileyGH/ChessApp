
/* 
 * Makes the best legal move for the given color.
 * Modified by me
 */
function makeBestMove(color) {
    if (color === 'b') {
        var move = getBestMove(game, color, globalSum)[0];
    } else {
        var move = getBestMove(game, color, -globalSum)[0];
    }
    globalSum = evaluateBoard(move, globalSum, 'b');
    updateAdvantage();

    game.move(move);
    board.position(game.fen());

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

//Used in AI2, needs to have a method here to avoid error
//"Written" by me
function fudgeEvaluation(sum) {
    return sum
}