document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');

    let isGameOver = false;
    let isPaused = false;
    let animationId;
    let score = 0;
    const speedIncreaseInterval = 20;
    const initialCactusSpeed = 5; // 초기 장애물 속도

    // 이미지 로드
    const runnerImage = new Image();
    runnerImage.src = 'runimg/player.png'; // 러너 이미지 경로

    const cactusImage = new Image();
    cactusImage.src = 'runimg/cactus.png'; // 장애물 이미지 경로

    const backgroundImage = new Image();
    backgroundImage.src = 'runimg/gameback.png'; // 배경 이미지 경로

    // 사운드 로드
    const backgroundMusic = new Audio('runsounds/gamebgm.mp3'); // 배경 음악
    const jumpSound = new Audio('runsounds/jump.mp3'); // 점프 효과음
    const collisionSound = new Audio('runsounds/gameover.mp3'); // 게임 종료 효과음

    // 러너 객체
    const runner = {
        x: 50,
        y: canvas.height - 100,
        width: 50,
        height: 50,
        dy: 0,
        gravity: 0.5,
        jumpStrength: -10,
        isJumping: false,
    };

    // 장애물 객체
    const cactus = {
        x: canvas.width,
        y: canvas.height - 50,
        width: 20,
        height: 50,
        dx: initialCactusSpeed, // 초기 장애물 속도
    };

    // 러너를 캔버스에 그리는 함수
    function drawRunner() {
        ctx.drawImage(runnerImage, runner.x, runner.y, runner.width, runner.height);
    }

    // 장애물을 캔버스에 그리는 함수
    function drawCactus() {
        ctx.drawImage(cactusImage, cactus.x, cactus.y, cactus.width, cactus.height);
    }

    // 배경을 캔버스에 그리는 함수
    function drawBackground() {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    // 점수를 캔버스에 표시하는 함수
    function drawScore() {
        ctx.font = '24px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(`Score: ${score}`, 10, 30);
    }

    

    // 러너의 위치를 업데이트하는 함수
    function updateRunner() {
        if (runner.isJumping) {
            runner.dy += runner.gravity;
            runner.y += runner.dy;

            if (runner.y > canvas.height - runner.height) {
                runner.y = canvas.height - runner.height;
                runner.dy = 0;
                runner.isJumping = false;
            }
        }
    }

    // 장애물의 위치를 업데이트하는 함수
    function updateCactus() {
        cactus.x -= cactus.dx;

        if (cactus.x < -cactus.width) {
            cactus.x = canvas.width;
            score += 2; // 장애물 하나당 2점 추가

            // 20점마다 속도 증가
            if (score % speedIncreaseInterval === 0) {
                cactus.dx += 1;
            }
        }
    }

    // 러너와 장애물의 충돌을 감지하는 함수
    function detectCollision() {
        if (cactus.x < runner.x + runner.width &&
            cactus.x + cactus.width > runner.x &&
            cactus.y < runner.y + runner.height &&
            cactus.y + cactus.height > runner.y) {
            isGameOver = true;
            collisionSound.play();
            backgroundMusic.pause();
            showStartButton();
        }
    }

    // 캔버스를 지우는 함수
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 게임 상태를 업데이트하고 화면을 다시 그리는 함수
    function updateGame() {
        if (isGameOver) {
            cancelAnimationFrame(animationId);
            return;
        }
        
        if (!isPaused) {
            clearCanvas();
            drawBackground();
            drawRunner();
            drawCactus();
            drawScore();
            updateRunner();
            updateCactus();
            detectCollision();
        }

        animationId = requestAnimationFrame(updateGame);
    }

    // 게임 시작 시 초기화하는 함수
    function startGame() {
        isGameOver = false;
        isPaused = false;
        score = 0;
        runner.y = canvas.height - runner.height;
        cactus.x = canvas.width;
        cactus.dx = initialCactusSpeed; // 초기 장애물 속도
        backgroundMusic.currentTime = 0;
        backgroundMusic.loop = true;
        backgroundMusic.play();
        updateGame();
    }

    // 게임 리셋 시 초기화하는 함수
    function resetGame() {
        isGameOver = false;
        isPaused = false;
        score = 0;
        runner.y = canvas.height - runner.height;
        runner.dy = 0;
        runner.isJumping = false;
        cactus.x = canvas.width;
        cactus.dx = initialCactusSpeed; // 초기 장애물 속도
        clearCanvas();
        startButton.style.display = 'block'; // 게임 시작 버튼 다시 표시
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'none';
        backgroundMusic.currentTime = 0;
    }

    // 게임 종료 후 다시 시작 버튼을 표시하는 함수
    function showStartButton() {
        startButton.style.display = 'block'; // 게임 시작 버튼 다시 표시
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'none';
    }

    // 이벤트 리스너 추가: 게임 시작 버튼 클릭 시
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        pauseButton.style.display = 'block';
        startGame();
    });

    // 이벤트 리스너 추가: 일시정지 버튼 클릭 시
    pauseButton.addEventListener('click', () => {
        isPaused = true;
        cancelAnimationFrame(animationId); // 현재 애니메이션 프레임을 취소
        backgroundMusic.pause();
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'block';
    });

    // 이벤트 리스너 추가: 재개 버튼 클릭 시
    resumeButton.addEventListener('click', () => {
        isPaused = false;
        backgroundMusic.play();
        resumeButton.style.display = 'none';
        pauseButton.style.display = 'block';
        requestAnimationFrame(updateGame); // 게임 업데이트 재개
    });

    // 이벤트 리스너 추가: 스페이스바를 눌렀을 때
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !runner.isJumping) {
            runner.isJumping = true;
            runner.dy = runner.jumpStrength;
            jumpSound.play();
        }
    });

    
    // 로그인 상태 확인
    fetch('/api/check-login')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                // 로그인하지 않은 경우 게임 시작 버튼 비활성화
                startButton.disabled = true;
                startButton.textContent = '로그인 필요';
                alert('게임을 시작하려면 로그인해야 합니다.');
                // 필요시 로그인 페이지로 리디렉션
                // window.location.href = '/login.html';
            } else {
                // 로그인된 경우 게임 시작 버튼 활성화
                startButton.disabled = false;
                startButton.textContent = '게임 시작';
            }
        })
        .catch(err => {
            console.error('Error checking login status:', err);
        });
});

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
