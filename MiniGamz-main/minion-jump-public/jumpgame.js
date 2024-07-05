const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const mainButton = document.getElementById('mainButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');

let isGameStarted = false; // 게임 시작 여부
let isGameOver = false; // 게임 종료 여부
let isGamePaused = false; // 게임 일시 정지 여부
let frameCount = 0; // 프레임 수
let score = 0; // 점수
let animationFrameId; // 애니메이션 프레임 ID
let platformSpeed = 1; // 초기 플랫폼 속도
let gravity = 0.5; // 중력
let moveLeft = false; // 왼쪽 이동 여부
let moveRight = false; // 오른쪽 이동 여부
let canJump = false; // 점프 가능 여부
let doubleJump = false; // 더블 점프 가능 여부
let isInitialJump = true; // 초기 점프 여부
let platformSpawnRate = 30; // 플랫폼 생성 주기

// 이미지 로드
const backgroundImg = new Image();
backgroundImg.src = 'jumpimg/gameback.png';

const playerImg = new Image();
playerImg.src = 'jumpimg/player.png';

const platformImg = new Image();
platformImg.src = 'jumpimg/platform.png';

// 사운드 로드
const jumpSound = new Audio('jumpsounds/jump.mp3');
const bgmSound = new Audio('jumpsounds/gamebgm.mp3');
const hitSound = new Audio('jumpsounds/gameover.mp3');
bgmSound.loop = true; // 배경 음악 반복 재생

// 플레이어 캐릭터 설정
const player = {
    x: canvas.width / 2 - 17, // 캔버스 중간에서 시작
    y: canvas.height / 2 - 12,
    width: 34,
    height: 24,
    lift: -12,  // 점프 범위
    maxJumpDistance: 180, // 최대 점프 거리
    maxJumpHeight: 100, // 최대 점프 높이
    velocity: 0,
    speed: 3 // 좌우 이동 속도
};

// 플랫폼 설정
const platforms = [];
const platformWidth = 100;
const platformHeight = 20;  // 플랫폼 높이
const platformVerticalGap = 200; // 플랫폼 수직 간격

// 모든 이미지가 로드되었는지 확인하는 함수
function allImagesLoaded(callback) {
    let loadedImagesCount = 0;
    const totalImages = 3;

    function imageLoaded() {
        loadedImagesCount++;
        if (loadedImagesCount === totalImages) {
            callback();
        }
    }

    backgroundImg.onload = imageLoaded;
    playerImg.onload = imageLoaded;
    platformImg.onload = imageLoaded;
}

// 점프 처리 함수
function handleJump() {
    if (isGameStarted && !isGameOver && !isGamePaused && (canJump || doubleJump)) {
        player.velocity = player.lift;
        jumpSound.play(); // 점프 사운드 재생

        if (!canJump && doubleJump) {
            doubleJump = false; // 더블 점프를 사용하면 더블 점프 상태 해제
        } else {
            canJump = false; // 기본 점프 사용 후 점프 불가능
        }

        // 초기 점프 후에 게임 루프 시작
        if (isInitialJump) {
            isInitialJump = false;
            gameLoop();
        }
    }
}

// 키보드 이벤트 리스너 설정
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        handleJump();
    }
    if (e.code === 'ArrowLeft') {
        moveLeft = true;
    }
    if (e.code === 'ArrowRight') {
        moveRight = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') {
        moveLeft = false;
    }
    if (e.code === 'ArrowRight') {
        moveRight = false;
    }
});

// 마우스 클릭 이벤트 리스너 설정
canvas.addEventListener('mousedown', () => {
    handleJump();
});

// 시작 버튼 클릭 이벤트 리스너 설정
startButton.addEventListener('click', () => {
    if (!isGameStarted && !isGameOver) {
        isGameStarted = true;
        isGamePaused = false;
        isInitialJump = true; // 초기 점프 설정
        startButton.style.display = 'none';
        pauseButton.style.display = 'block';
        resumeButton.style.display = 'none';
        restartButton.style.display = 'inline';
        bgmSound.play(); // 배경 음악 재생
        resetGame(); // 게임 상태 초기화
        render(); // 초기 화면 렌더링
    } else if (isGameOver) {
        resetGame(); // 게임 상태 초기화
        isGameOver = false;
        isGameStarted = true;
        isInitialJump = true; // 초기 점프 설정
        startButton.style.display = 'none';
        pauseButton.style.display = 'block';
        resumeButton.style.display = 'none';
        restartButton.style.display = 'inline';
        bgmSound.play(); // 배경 음악 재생
        render(); // 초기 화면 렌더링
    }
});

// 일시 정지 버튼 클릭 이벤트 리스너 설정
pauseButton.addEventListener('click', () => {
    isGamePaused = true;
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'block';
    bgmSound.pause(); // 배경 음악 일시 정지
});

// 재개 버튼 클릭 이벤트 리스너 설정
resumeButton.addEventListener('click', () => {
    isGamePaused = false;
    pauseButton.style.display = 'block';
    resumeButton.style.display = 'none';
    bgmSound.play(); // 배경 음악 재개
});

// 재시작 버튼 클릭 이벤트 리스너 설정
restartButton.addEventListener('click', () => {
    cancelAnimationFrame(animationFrameId);  // 기존의 게임 루프 중지
    resetGame();
    isGameStarted = false;
    startButton.style.display = 'inline';
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'none';
    restartButton.style.display = 'none';
});

// 메인 버튼 클릭 이벤트 리스너 설정
mainButton.addEventListener('click', () => {
    window.location.href = '/';  // 메인 페이지 URL로 이동(메인페이지 경로추가해야함)
});

// 플랫폼 생성 함수
function createPlatform(y) {
    let platformX;
    if (platforms.length > 0) {
        const lastPlatform = platforms[platforms.length - 1];
        const maxGap = player.maxJumpDistance;
        const minGap = player.maxJumpDistance / 2;
        const maxVerticalGap = player.maxJumpHeight;
        const minVerticalGap = player.maxJumpHeight / 2;
        platformX = lastPlatform.x + (Math.random() * (maxGap - minGap) + minGap) * (Math.random() < 0.5 ? -1 : 1);
        platformX = Math.max(0, Math.min(canvas.width - platformWidth, platformX));
        y = lastPlatform.y - (Math.random() * (maxVerticalGap - minVerticalGap) + minVerticalGap);
    } else {
        platformX = Math.floor(Math.random() * (canvas.width - platformWidth));
    }

    platforms.push({
        x: platformX,
        y: y,
        width: platformWidth,
        height: platformHeight
    });
}

// 게임 상태 업데이트 함수
function update() {
    if (isGameOver || isGamePaused) return;

    player.velocity += gravity;
    player.y += player.velocity;

    if (moveLeft) {
        player.x -= player.speed;
        if (player.x < 0) {
            player.x = 0;
        }
    }

    if (moveRight) {
        player.x += player.speed;
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }
    }

    // 플랫폼 생성 주기를 더 짧게 설정하여 더 자주 생성되도록 함
    if (frameCount % platformSpawnRate === 0) {
        createPlatform(-platformHeight);
    }

    for (let i = platforms.length - 1; i >= 0; i--) {
        platforms[i].y += platformSpeed;

        // 플레이어가 플랫폼과 충돌했는지 확인
        if (
            player.x < platforms[i].x + platforms[i].width &&
            player.x + player.width > platforms[i].x &&
            player.y < platforms[i].y + platforms[i].height &&
            player.y + player.height > platforms[i].y
        ) {
            // 플레이어가 플랫폼 위에 있을 때만 점프 가능
            if (player.velocity > 0) {
                player.velocity = 0;
                player.y = platforms[i].y - player.height; // 플랫폼 위에 위치
                canJump = true; // 점프 가능 상태 설정
                doubleJump = true; // 더블 점프 가능 상태 설정
            }
        }

        // 플랫폼이 캔버스를 벗어나면 제거하고 점수 증가
        if (platforms[i].y > canvas.height) {
            platforms.splice(i, 1);
            score++;
            if (score % 20 === 0) { // 스코어가 20점마다 속도 및 생성 주기 증가
                platformSpeed += 0.2; // 속도 증가를 천천히
                gravity += 0.0008; // 중력 증가를 천천히
                platformSpawnRate = Math.max(10, platformSpawnRate - 2); // 생성 주기 감소를 천천히(최소 10까지 감소)
            }
        }
    }

    // 플레이어가 캔버스 하단을 벗어나면 게임 종료
    if (player.y > canvas.height) {
        endGame();
    }

    frameCount++;
}

// 게임 렌더링 함수
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 게임 배경 이미지 그리기
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    // 플레이어 그리기
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // 플랫폼 그리기
    for (let i = 0; i < platforms.length; i++) {
        ctx.drawImage(platformImg, platforms[i].x, platforms[i].y, platforms[i].width, platforms[i].height);
    }

    // 점수 표시
    ctx.fillStyle = '#FFF';  // 점수 텍스트 색상 설정
    ctx.font = '30px Arial';  // 점수 텍스트 크기 설정
    ctx.fillText(`Score: ${score}`, 10, 40);
}

// 게임 종료 함수
function endGame() {
    isGameOver = true;
    isGameStarted = false;  // 게임이 끝났음을 표시
    cancelAnimationFrame(animationFrameId);  // 게임 루프 중지
    bgmSound.pause(); // 배경 음악 중지
    bgmSound.currentTime = 0; // 배경 음악 위치 초기화
    hitSound.play(); // 부딪힐 때 소리 재생
    startButton.textContent = '게임 시작';
    startButton.style.display = 'inline';
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'none';
    restartButton.style.display = 'none';
}

// 게임 초기화 함수
function resetGame() {
    platforms.length = 0; // 플랫폼 배열 초기화
    for (let i = 0; i < 5; i++) {
        createPlatform(canvas.height - (i + 1) * platformVerticalGap);
    }
    player.x = platforms[0].x + platforms[0].width / 2 - player.width / 2; // 첫 번째 플랫폼 위에 배치
    player.y = platforms[0].y - player.height;
    player.velocity = 0;
    score = 0;
    frameCount = 0;
    platformSpeed = 1; // 초기 플랫폼 속도 재설정
    gravity = 0.5; // 초기 중력 재설정
    canJump = true; // 점프 가능 상태 초기화
    doubleJump = false; // 더블 점프 초기화
    isGameOver = false;
    platformSpawnRate = 30; // 초기 플랫폼 생성 주기 재설정
}

// 게임 루프 함수
function gameLoop() {
    update();
    render();
    if (!isGameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// 모든 이미지가 로드된 후 게임을 시작
allImagesLoaded(() => {
    startButton.style.display = 'block';

    // 처음에 몇 개의 플랫폼을 생성하여 플레이어가 그 위에서 시작할 수 있도록 함
    resetGame();
    
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