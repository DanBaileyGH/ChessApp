
/* 
 * Makes the best legal move for the given color.
 */
function makeBestMove(color) {
    if (color === 'b') {
        var move = getBestMove(game, color, globalSum)[0];
    } else {
        var move = getBestMove(game, color, -globalSum)[0];
    }

    console.log("best move", move)

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
        //sometimes this breaks, dont have time to figure out why
        console.log("switch sides bug error caught in makebestmove function")
        console.log("move that caused bug:", move)
    }
    
    if (game.in_checkmate() || game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
        nextBtn.style.visibility = "visible";
        if (game.in_checkmate()) {
            gameEndTxt.innerHTML = "Unlucky Loss!"
        } else {
            gameEndTxt.innerHTML = "Nice Draw!"
        }
    } else {
        $('#new').text("Your Move!");
    }
}
