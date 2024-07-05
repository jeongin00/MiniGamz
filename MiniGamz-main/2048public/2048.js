const cell = document.querySelectorAll('.cell');
let cellLength = cell.length;
let board = new Array(6);
const scoreText = document.querySelector('#score');
const gameOverContainer = document.getElementById('gameover-container');
const gameContainer = document.getElementById('game-container');
let score = 0;

let overCheck = 1;
let numCheck = 1;

for (let i = 0; i < 6; i++) {
    board[i] = new Array(6);
}

for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
        if (i == 0 || j == 0 || i == 5 || j == 5) {
            board[i][j] = 1;
        }
    }
}

console.log(board);

function checkLoginStatus() {
    fetch('/api/check-login')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                // 로그인하지 않은 경우 게임 컨트롤 비활성화 및 경고 메시지 표시
                document.body.removeEventListener("keydown", handleKeydown);
                alert('게임을 시작하려면 로그인해야 합니다.');
            } else {
                // 로그인된 경우 게임 컨트롤 활성화
                document.body.addEventListener("keydown", handleKeydown);
                init(); // 게임 초기화
            }
        })
        .catch(err => {
            console.error('Error checking login status:', err);
        });
}

function init() {
    for (let i = 1; i < 5; i++) {
        for (let j = 1; j < 5; j++) {
            board[i][j] = 0;
        }
    }
    randomNum();
    randomNum();
    update();
}

function update() {
    let cnt = 0;
    for (let i = 1; i < 5; i++) {
        for (let j = 1; j < 5; j++) {
            cell[cnt].innerHTML = board[i][j] == 0 ? "" : board[i][j];
            coloring(cnt);
            cnt++;
        }
    }
    setScore();
}

function setScore() {
    scoreText.innerHTML = "Score : " + score;
}

function coloring(cnt) {
    cell[cnt].style.border = "solid black 1px";
    switch (cell[cnt].innerHTML) {
        case "2":
            cell[cnt].style.backgroundColor = "#0278AE";
            break;
        case "4":
            cell[cnt].style.backgroundColor = "#51ADCF";
            break;
        case "8":
            cell[cnt].style.backgroundColor = "#3D72A6";
            break;    
        case "16":
            cell[cnt].style.backgroundColor = "#7579E7";
            break;
        case "32":
            cell[cnt].style.backgroundColor = "#9AB3F5";
            break;
        case "64":
            cell[cnt].style.backgroundColor = "#B088F9";
            break;
        case "128":
            cell[cnt].style.backgroundColor = "#c4fb6d";
            break;
        case "256":
            cell[cnt].style.backgroundColor = "#0be881";
            break;
        case "512":
            cell[cnt].style.backgroundColor = "#34e7e4";
            break;
        case "1024":
            cell[cnt].style.backgroundColor = "#cd84f1";
            break;
        case "2048":
            cell[cnt].style.backgroundColor = "#F8EFBA";
            break;
        default:
            if(cell.innerHTML > 2048) {
                cell[cnt].style.backgroundColor = "#7d5fff";
            }
            else {
                cell[cnt].style.backgroundColor = "#808e9b";
            }    
    }
}

function randomNum() {
    let ranPlaceX = Math.floor(Math.random() * 4 + 1);
    let ranPlaceY = Math.floor(Math.random() * 4 + 1);
    if (board[ranPlaceX][ranPlaceY] == 0) {
        board[ranPlaceX][ranPlaceY] = 2;
    } else {
        randomNum();
    }
    update();
}

function moveLeftNum() {
    let k;

    numCheck = 1

    for(let i = 1; i < 5; i++) {
        for(let j = 1; j < 5; j++) {
            if(board[i][j] != 0) {
                k = j;
                while(1) {
                    if(board[i][k-1] != 0) {
                        break;
                    }
                    board[i][k-1] = board[i][k];
                    board[i][k] = 0;
                    k--;
                    numCheck = 0;
                }
            }
        }
    }
}

function moveLeft() {
    gameOver();
    moveLeftNum();

    for(let i = 1; i < 5; i++) {
        for(let j = 1; j < 4; j++) {
            if(board[i][j] == board[i][j+1] && board[i][j] != 0) {
                numCheck = 0;
                score += board[i][j];
                board[i][j] *= 2;
                board[i][j+1] = 0;
            }
        }
    }
    if(!numCheck) {
        moveLeftNum();
        randomNum();
        update();
    }
}

function moveUpNum() {
    let k;

    numCheck = 1;

    for(let i = 1; i < 5; i++) {
        for(let j = 1; j < 5; j++) {
            if(board[j][i] != 0) {
                k = j;
                while(1) {
                    if(board[k-1][i] != 0) {
                        break;
                    }
                    board[k-1][i] = board[k][i];
                    board[k][i] = 0;
                    k--;
                    numCheck = 0;
                }
            }
        }
    }
}

function moveUp() {
    gameOver();
    moveUpNum();

    for(let i = 1; i < 5; i++) {
        for(let j = 1; j < 4; j++) {
            if(board[j][i] == board[j+1][i] && board[j][i] != 0) {
                score += board[j][i];
                board[j][i] *= 2;
                board[j+1][i] = 0;
                numCheck = 0;
            }
        }
    }
    if(!numCheck) {
        moveUpNum();
        randomNum();
        update();
    }
}

function moveRightNum() {
    let k;

    numCheck = 1;

    for(let i = 1; i < 5; i++) {
        for(let j = 4; j > 0; j--) {
            if(board[i][j] != 0) {
                k = j;
                while(1) {
                    if(board[i][k+1] != 0) {
                        break;
                    }
                    board[i][k+1] = board[i][k];
                    board[i][k] = 0;
                    k++;
                    numCheck = 0;
                }
            }
        }
    }
}

function moveRight() {
    gameOver();
    moveRightNum();

    for(let i = 1; i < 5; i++) {
        for(let j = 4; j >1; j--) {
            if(board[i][j] == board[i][j-1] && board[i][j] != 0) {
                score += board[i][j];
                board[i][j] *= 2;
                board[i][j-1] = 0;
                numCheck = 0;
            }
        }
    }
    if(!numCheck) {
        moveRightNum();
        randomNum();
        update();
    }
}

function moveDownNum() {
    let k;

    numCheck = 1;

    for(let i = 1; i < 5; i++) {
        for(let j = 4; j > 0; j--) {
            if(board[j][i] != 0) {
                k = j;
                while(1) {
                    if(board[k+1][i] != 0) {
                        break;
                    }
                    board[k+1][i] = board[k][i];
                    board[k][i] = 0;
                    k++; 
                    numCheck = 0;
                }
            }
        }
    }
}

function moveDown(){
    gameOver();
    moveDownNum();

    for(let i = 1; i < 5; i++) {
        for(let j = 4; j > 1; j--) {
            if(board[j][i] == board[j-1][i] && board[j][i] != 0) {
                score += board[j][i];
                board[j][i] *= 2;
                board[j-1][i] = 0;
                numCheck = 0;
            }
        }
    }
    if(!numCheck) {     
        moveDownNum();
        randomNum();
        update();
    }
}

function rowCheck() {
    for(let i = 1; i < 5; i++) {
        for(let j = 1; j < 4; j++) {
            if(board[i][j] == board[i][j+1]) {
                overCheck = 0;
            }
        }
    }
}

function columnCheck() {
    for(let i = 1; i < 5; i++) {
        for(let j = 1; j < 4; j++) {
            if(board[j][i] == board[j+1][i]) {
                overCheck = 0;
            }
        }
    }
}

function gameOver() {
    let fullCheck = 1;

    for (let i = 1; i < 5; i++) {
        for (let j = 1; j < 5; j++) {
            if (board[i][j] == 0) {
                fullCheck = 0;
            }
        }
    }
    rowCheck();
    columnCheck();
    if (fullCheck && overCheck) {
        gameOverContainer.classList.remove('hidden');
    }

    overCheck = 1;
}

function retryGame() {
    gameOverContainer.classList.add('hidden');
    score = 0;
    init();
}

function handleKeydown(e) {
    const keyCode = e.keyCode;
    if (keyCode == 37) {
        moveLeft();
    } else if (keyCode == 38) {
        moveUp();
    } else if (keyCode == 39) {
        moveRight();
    } else if (keyCode == 40) {
        moveDown();
    }
}


function toggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const button = document.getElementById('toggleButton');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        button.innerHTML = '&#9660;'; // 아래삼각형
    } else {
        content.style.display = 'none';
        button.innerHTML = '&#9650;'; // 윗삼각형
    }
}

function toggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const button = document.getElementById('toggleButton');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        button.innerHTML = '&#9660;'; // 아래삼각형
    } else {
        content.style.display = 'none';
        button.innerHTML = '&#9650;'; // 윗삼각형
    }
}
// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', checkLoginStatus);