var board = [];
var listOfMoves = [];
var move = [];
var gameMode;
var gameDifficulty;
var currentPlayer;
var boardHistory = [];
var movesHistory;
var listOfMovesHistory;
var winner;
var player1Type;
var player2Type;
var gameIndex;
//GAME STATES: MAIN_MENU, INITIALIZING_GAME, WAITING_NEW_BOARD, WAITING_VALID_MOVES, WAITING_MOVE, WAITING_BOT_MOVE, CHECKING_GAME_OVER, GAME_OVER
var gameState = "MAIN_MENU";
var isMoving = false;
var startTimeoutTime = 0;
//GAME STATES: WAITING_FIRST_PICK, WAITING_SECOND_PICK
var waitingMoveState = "";
var timeoutTurn;

var gameMovieIndex = 0;
var gameMovieLoop;
function initializeGameVariables(newGameMode, newGameDifficulty) {
    gameState = "INITIALIZING_GAME";
    board = [];
    listOfMoves = [];
    move = [];
    gameMode = newGameMode || 1;
    gameDifficulty = newGameDifficulty || 1;
    currentPlayer = 1;
    boardHistory = [];
    movesHistory = [];
    listOfMovesHistory = [];
    gameIndex = 0;
    winner = 0;
    switch (gameMode) {
    case 1:
        player1Type = 0;
        player2Type = 0;
        break;
    case 2:
        player1Type = 0;
        player2Type = 1;
        break;
    case 3:
        player1Type = 1;
        player2Type = 1;
        break;
    default:
        return false;
    }
    gameState = "WAITING_NEW_BOARD";
    isMoving = false;
    getPrologRequest("initializeBoard", (function(data) {
        setBoard(JSON.parse(data.target.response));
        if (player1Type == 0) {
            getValidMoves(board, currentPlayer);
        } else if (player1Type == 1) {
            botMove();
        }
    }), (function() {
        console.log("Erro");
    }));
    return true;
}
function changeCurrentPlayer() {
    if (currentPlayer == 1) {
        currentPlayer = 2;
    } else if (currentPlayer == 2) {
        currentPlayer = 1;
    } else {
        return false;
    }
    return true;
}
function getValidMoves() {
    gameState = "WAITING_VALID_MOVES";
    getPrologRequest("validMoves(" + JSON.stringify(board) + "," + currentPlayer + ")", (function(data) {
        listOfMoves = JSON.parse(data.target.response);
        listOfMovesHistory.push(listOfMoves);
        move = [];
        gameState = "WAITING_MOVE";
        waitingMoveState = "WAITING_FIRST_PICK";
    }), (function() {
        console.log("Erro");
    }));
}
function isValidInitialPosition(initialX, initialY) {
    for (var i = 0; i < listOfMoves.length; i++) {
        //console.log(listOfMoves[i][0]);
        if (listOfMoves[i][0] == initialX && listOfMoves[i][1] == initialY) {
            return true;
        }
    }
    return false;
}
function isValidFinalPosition(finalX, finalY) {
    if (move.length != 2) {
        return false;
    }
    for (var i = 0; i < listOfMoves.length; i++) {
        //console.log(listOfMoves[i][0]);
        if (listOfMoves[i][0] == move[0] && listOfMoves[i][1] == move[1] && listOfMoves[i][2] == finalX && listOfMoves[i][3] == finalY) {
            return true;
        }
    }
    return false;
}
/*function movePiece() {
    gameState = "MOVING";
    if (move.length != 4) {
        return false;
    }
    getPrologRequest("move(" + currentPlayer + "," + JSON.stringify(board) + "," + move[0] + "," + move[1] + "," + move[2] + "," + move[3] + ")", (function(data) {
        setBoard(JSON.parse(data.target.response));
        movesHistory.push(move);
        move = [];
        changeCurrentPlayer();
        gameIndex++;

        if (currentPlayer == 1) {
            if (player1Type == 0) {
                getValidMoves();
            } else if (player1Type == 1) {
                botMove();
            }
        } else if (currentPlayer == 2) {
            if (player2Type == 0) {
                getValidMoves();
            } else if (player2Type == 1) {
                                botMove();
            }
        }
        getValidMoves();
    }), (function() {
        console.log("Erro");
        move = [];
        gameState = "WAITING_MOVE";
        waitingMoveState = "WAITING_FIRST_PICK";
    }));
}*/
function movePiece() {
    isMoving = true;
    if (move.length != 4) {
        return false;
    }
    getPrologRequest("move(" + currentPlayer + "," + JSON.stringify(board) + "," + move[0] + "," + move[1] + "," + move[2] + "," + move[3] + ")", (function(data) {
        updateGameState(JSON.parse(data.target.response));
    }), (function() {
        console.log("Erro");
        move = [];
        getValidMoves();
    }));
}
function botMove() {
    gameState = "WAITING_BOT_MOVE";
    getPrologRequest("botMove(" + currentPlayer + "," + JSON.stringify(board) + "," + gameDifficulty + ")", (function(data) {
        move = JSON.parse(data.target.response);
        movePiece();
    }), (function() {
        console.log("Erro");
        botMove();
    }));
}
function updateGameState(newBoard) {
    setBoard(newBoard);
    movesHistory.push(move);
    gameIndex++;
    checkGameOver();
}
function checkGameOver() {
    gameState = "CHECKING_GAME_OVER";
    getPrologRequest("gameOver(" + JSON.stringify(board) + ")", (function(data) {

        if (data.target.response != 1 && data.target.response != 2) {
            move = [];
            changeCurrentPlayer();
            passTurnIfPossible();
        } else {
            winner = data.target.response;
            setGameOverIfPossible();
        }
    }), (function() {
        console.log("ERRO");
    }));
}
function passTurnIfPossible() {
    if (isMoving){
        setTimeout(passTurnIfPossible,100);
    } else {
        if (currentPlayer == 1) {
            if (player1Type == 0) {
                getValidMoves();
            } else if (player1Type == 1) {
                botMove();
            }
        } else if (currentPlayer == 2) {
            if (player2Type == 0) {
                getValidMoves();
            } else if (player2Type == 1) {
                botMove();
            }
        }
    }
}
function setGameOverIfPossible() {
    if (isMoving){
        setTimeout(setGameOverIfPossible,100);
    } else {
        gameState = "GAME_OVER";
    }
}


function setInitialPosition(initialX, initialY) {
    move[0] = initialX;
    move[1] = initialY;
}
function getInitialPosition() {
    if (move.length == 2) {
        return move;
    } else {
        return false;
    }
}
function setFinalPosition(finalX, finalY) {
    move[2] = finalX;
    move[3] = finalY;
}
function setBoard(newBoard) {
    board = newBoard;
    boardHistory.push(newBoard);
}

function setGameState(newGameState) {
    gameState = newGameState;
}

function undoPlay(){
    if(gameIndex == 0 || gameMode == 3 || (gameMode == 2 && currentPlayer == 2)) return;
    if (gameMode == 1){
        nUndos = 1;
    }else if (gameMode == 2){
        nUndos = 2;
    }
    for(var i = 0; i < nUndos; i++) {
        gameIndex--;
        board = boardHistory[gameIndex];
        boardHistory.pop();
        movesHistory.pop();
        listOfMovesHistory.pop();
        move = [];
        changeCurrentPlayer();
    }
    passTurnIfPossible();
}