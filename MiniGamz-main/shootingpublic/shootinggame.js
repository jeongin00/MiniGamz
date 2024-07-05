const canvas = document.getElementById('gameCanvas'); // 캔버스 요소 가져오기
const ctx = canvas.getContext('2d'); // 2D 컨텍스트 가져오기
const startButton = document.getElementById('startButton'); // 시작 버튼 요소 가져오기
const backgroundMusic = document.getElementById('backgroundMusic'); // 배경음악 요소 가져오기

canvas.width = 800; // 캔버스 너비 설정
canvas.height = 600; // 캔버스 높이 설정

const spaceship = { // 우주선 객체 생성
  x: canvas.width / 2 - 25, // 우주선 초기 x 위치
  y: canvas.height - 60, // 우주선 초기 y 위치
  width: 60, // 우주선 너비
  height: 60, // 우주선 높이
  dx: 50 // 우주선 좌우 이동 속도
};

const spaceshipImage = new Image(); // 우주선 이미지 객체 생성
spaceshipImage.src = 'shootingimages/spaceship.png'; // 우주선 이미지 경로 설정

const enemyImage = new Image(); // 적 이미지 객체 생성
enemyImage.src = 'shootingimages/enemy.png'; // 적 이미지 경로 설정

const itemImage = new Image(); // 아이템 이미지 객체 생성
itemImage.src = 'shootingimages/item.png'; // 아이템 이미지 경로 설정

const potionImage = new Image(); // 포션 이미지 객체 생성
potionImage.src = 'shootingimages/potion.png'; // 포션 이미지 경로 설정

const backgroundImage = new Image(); // 배경 이미지 객체 생성
backgroundImage.src = 'shootingimages/background.png'; // 배경 이미지 경로 설정

const mainButton = document.getElementById('mainButton'); // Main 버튼 요소 가져오기

mainButton.addEventListener('click', () => {
  window.location.href = '/'; // index.html로 이동
});

const bullets = []; // 총알 배열 생성
const enemies = []; // 적 배열 생성
const items = []; // 아이템 배열 생성
const potions = []; // 포션 배열 생성
const enemySpawnInterval = 2000; // 적 생성 간격 설정 (밀리초)
const itemSpawnInterval = 15000; // 아이템 생성 간격 설정 (밀리초)
const potionSpawnInterval = 30000; // 포션 생성 간격 설정 (밀리초)
let lastEnemySpawn = 0; // 마지막 적 생성 시간 초기화
let lastItemSpawn = 0; // 마지막 아이템 생성 시간 초기화
let lastPotionSpawn = 0; // 마지막 포션 생성 시간 초기화
let score = 0; // 점수 초기화
let lives = 3; // 목숨 3개 설정
let gameInterval; // 게임 인터벌 변수
let bulletInterval; // 총알 발사 인터벌 변수
let bulletIntervalTime = 2000; // 총알 발사 간격 초기화
let gameSpeed = 1; // 게임 속도 초기화
let gameOver = false; // 게임 오버 상태 초기화
let itemsCollected = 0; // 아이템 수집 개수 초기화

const fullHeart = '❤️'; // 꽉찬 하트 이모지
const emptyHeart = '🤍'; // 빈 하트 이모지

startButton.addEventListener('click', startGame); // 시작 버튼 클릭 이벤트 리스너 추가

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

function checkLoginStatus() {
    fetch('/api/check-login')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                // 로그인하지 않은 경우 게임 시작 버튼 비활성화
                startButton.disabled = true;
                startButton.textContent = '로그인 필요';
                alert('게임을 시작하려면 로그인해야 합니다.');
            } else {
                // 로그인된 경우 게임 시작 버튼 활성화
                startButton.disabled = false;
                startButton.textContent = '게임 시작';
            }
        })
        .catch(err => {
            console.error('Error checking login status:', err);
        });
}

// 페이지 로드 시 로그인 상태 확인
window.onload = function() {
    checkLoginStatus();
};

function startGame() {
  startButton.style.display = 'none'; // 시작 버튼 숨기기
  canvas.style.display = 'block'; // 캔버스 보이기
  backgroundMusic.play(); // 배경음악 재생
  resetGame(); // 게임 리셋
}

function drawSpaceship() { // 우주선 그리기 함수
  ctx.drawImage(spaceshipImage, spaceship.x, spaceship.y, spaceship.width, spaceship.height); // 우주선 이미지 그리기
}

function drawBullets() { // 총알 그리기 함수
  ctx.fillStyle = 'red'; // 총알 색상 설정
  bullets.forEach(bullet => { // 모든 총알에 대해
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); // 총알 그리기
    bullet.y -= bullet.dy; // 총알 이동
  });
}

function drawEnemies() { // 적 그리기 함수
  enemies.forEach(enemy => { // 모든 적에 대해
    ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height); // 적 이미지 그리기
    enemy.y += enemy.dy * gameSpeed; // 적 이동 (게임 속도 반영)
  });
}

function drawItems() { // 아이템 그리기 함수
  items.forEach(item => { // 모든 아이템에 대해
    ctx.drawImage(itemImage, item.x, item.y, item.width, item.height); // 아이템 이미지 그리기
    item.y += item.dy * gameSpeed; // 아이템 이동 (게임 속도 반영)
  });
}

function drawPotions() { // 포션 그리기 함수
  potions.forEach(potion => { // 모든 포션에 대해
    ctx.drawImage(potionImage, potion.x, potion.y, potion.width, potion.height); // 포션 이미지 그리기
    potion.y += potion.dy * gameSpeed; // 포션 이동 (게임 속도 반영)
  });
}

// 적 생성 함수 추가
function spawnEnemy() {
  const enemyWidth = 80;
  const enemyHeight = 80;
  const maxAttempts = 10; // 최대 시도 횟수 설정

  for (let i = 0; i < 5; i++) { // 한 번에 여러 적 생성
    let x, y;
    let overlapping;
    let attempts = 0;

    do {
      x = Math.random() * (canvas.width - enemyWidth); // 적의 x 위치 랜덤 설정
      y = 0; // 적의 y 위치 초기화
      overlapping = false;

      for (const enemy of enemies) { // 기존 적들과의 충돌 검사
        if (x < enemy.x + enemy.width &&
            x + enemyWidth > enemy.x &&
            y < enemy.y + enemyHeight &&
            y + enemyHeight > enemy.y) {
          overlapping = true;
          break;
        }
      }

      attempts++;
    } while (overlapping && attempts < maxAttempts); // 충돌이 없을 때까지 또는 최대 시도 횟수까지 반복

    if (!overlapping) {
      enemies.push({ // 새로운 적 추가
        x: x,
        y: y,
        width: enemyWidth,
        height: enemyHeight,
        dy: 3 // 적의 이동 속도
      });
    }
  }
}

function drawScore() { // 점수 그리기 함수
  ctx.fillStyle = 'white'; // 점수 색상 설정
  ctx.font = '20px Arial'; // 점수 글꼴 설정
  ctx.fillText(`Score: ${score}`, canvas.width - 100, 30); // 점수 텍스트 그리기
}

function drawLives() { // 목숨 그리기 함수
  ctx.fillStyle = 'white'; // 목숨 색상 설정
  ctx.font = '20px Arial'; // 목숨 글꼴 설정
  let livesText = '';
  for (let i = 0;  i < 3; i++) {
    livesText += (i < lives) ? fullHeart : emptyHeart; // 목숨 상태에 따라 하트 표시
  }
  ctx.fillText(`Lives: ${livesText}`, 10, 30); // 목숨 텍스트 그리기
}

function drawGameOver() { // 게임 오버 메시지 그리기 함수
  ctx.fillStyle = 'white'; // 텍스트 색상 설정
  ctx.font = '50px Arial'; // 텍스트 글꼴 설정
  ctx.fillText('Game Over', canvas.width / 2 - 150, canvas.height / 2 - 25); // 게임 오버 텍스트 그리기

  const retryButton = document.createElement('button'); // 버튼 요소 생성
  retryButton.innerText = 'Retry'; // 버튼 텍스트 설정

  // canvas의 위치를 기준으로 버튼 위치 설정
  const rect = canvas.getBoundingClientRect();
  retryButton.style.position = 'absolute'; // 버튼 위치 설정
  retryButton.style.left = `${rect.left + canvas.width / 2 - 70}px`; // 버튼 x 위치 설정 (canvas 기준 오른쪽으로 이동)
  retryButton.style.top = `${rect.top + canvas.height / 2 }px`; // 버튼 y 위치 설정 (canvas 기준 아래로 이동)

  retryButton.style.padding = '10px 20px'; // 버튼 패딩 설정
  retryButton.style.fontSize = '20px'; // 버튼 글꼴 크기 설정
  document.body.appendChild(retryButton); // 버튼을 문서에 추가

  const handleRetry = () => {
    document.body.removeChild(retryButton); // 버튼 제거
    resetGame(); // 게임 리셋
    document.removeEventListener('keydown', handleEnterKey); // 키 다운 이벤트 리스너 제거
  };

  retryButton.addEventListener('click', handleRetry); // 버튼 클릭 이벤트 추가

  const handleEnterKey = (event) => {
    if (event.key === 'Enter') {
      retryButton.click(); // Enter 키 누르면 버튼 클릭 이벤트 트리거
    }
  };

  document.addEventListener('keydown', handleEnterKey); // 키 다운 이벤트 리스너 추가
}

function shootBullet() {
  bullets.push({ // 총알 추가
    x: spaceship.x + spaceship.width / 2 - 2.5, // 총알의 x 위치
    y: spaceship.y, // 총알의 y 위치
    width: 5, // 총알의 너비
    height: 10, // 총알의 높이
    dy: 5 // 총알의 이동 속도
  });
}

function update() { // 게임 업데이트 함수
  if (gameOver) return; // 게임 오버 상태이면 업데이트 중지

  ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 이미지 그리기
  drawSpaceship(); // 우주선 그리기
  drawBullets(); // 총알 그리기
  drawEnemies(); // 적 그리기
  drawItems(); // 아이템 그리기
  drawPotions(); // 포션 그리기
  drawScore(); // 점수 그리기
  drawLives(); // 목숨 그리기

  bullets.forEach((bullet, bulletIndex) => { // 모든 총알에 대해
    if (bullet.y + bullet.height < 0) { // 총알이 화면을 벗어나면
      bullets.splice(bulletIndex, 1); // 총알 배열에서 제거
    } else { // 총알이 화면 안에 있을 경우
      enemies.forEach((enemy, enemyIndex) => { // 모든 적에 대해
        if (bullet.x < enemy.x + enemy.width && // 총알과 적의 충돌 판정
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y) {
          bullets.splice(bulletIndex, 1); // 충돌 시 총알 제거
          enemies.splice(enemyIndex, 1); // 충돌 시 적 제거
          score += 10; // 점수 10점 추가
        }
      });
    }
  });

  items.forEach((item, itemIndex) => { // 모든 아이템에 대해
    if (item.y > canvas.height) { // 아이템이 화면을 벗어나면
      items.splice(itemIndex, 1); // 아이템 배열에서 제거
    }

    if (item.x < spaceship.x + spaceship.width && // 아이템과 우주선의 충돌 판정
        item.x + item.width > spaceship.x &&
        item.y < spaceship.y + spaceship.height &&
        item.y + item.height > spaceship.y) {
      items.splice(itemIndex, 1); // 충돌 시 아이템 제거
      itemsCollected++; // 아이템 수집 개수 증가
      if (itemsCollected < 2) { // 아이템을 2개 이하로 수집할 경우
        clearInterval(bulletInterval); // 기존 총알 발사 인터벌 제거
        bulletIntervalTime /= 2; // 총알 발사 간격 두 배로 빠르게
        bulletInterval = setInterval(shootBullet, bulletIntervalTime); // 새로운 총알 발사 인터벌 설정
      }
    }
  });

  potions.forEach((potion, potionIndex) => { // 모든 포션에 대해
    if (potion.y > canvas.height) { // 포션이 화면을 벗어나면
      potions.splice(potionIndex, 1); // 포션 배열에서 제거
    }

    if (potion.x < spaceship.x + spaceship.width && // 포션과 우주선의 충돌 판정
        potion.x + potion.width > spaceship.x &&
        potion.y < spaceship.y + spaceship.height &&
        potion.y + potion.height > spaceship.y) {
      potions.splice(potionIndex, 1); // 충돌 시 포션 제거
      if (lives < 3) { // 목숨이 최대치가 아니면
        lives++; // 목숨 1 증가
      }
    }
  });

  enemies.forEach((enemy, enemyIndex) => { // 모든 적에 대해
    if (enemy.y > canvas.height) { // 적이 화면을 벗어나면
      enemies.splice(enemyIndex, 1); // 적 배열에서 제거
    }

    if (enemy.x < spaceship.x + spaceship.width && // 적과 우주선의 충돌 판정
        enemy.x + enemy.width > spaceship.x &&
        enemy.y < spaceship.y + spaceship.height &&
        enemy.y + enemy.height > spaceship.y) {
      enemies.splice(enemyIndex, 1); // 충돌 시 적 제거
      lives--; // 목숨 감소
      if (lives === 0) { // 목숨이 0이 되면
        drawGameOver(); // 게임 오버 메시지 그리기
        gameOver = true; // 게임 오버 상태 설정
        clearInterval(bulletInterval); // 총알 발사 인터벌 제거
        clearInterval(gameInterval); // 게임 인터벌 제거
      }
    }
  });

  const now = Date.now(); // 현재 시간 가져오기
if (now - lastEnemySpawn > enemySpawnInterval) {
  spawnEnemy(); // 적 생성 함수 호출
  lastEnemySpawn = now; // 마지막 적 생성 시간 업데이트
  gameSpeed += 0.1; // 게임 속도 증가
}

  if (now - lastItemSpawn > itemSpawnInterval && itemsCollected < 2) { // 아이템 생성 간격이 지났고 아이템을 2개 이하로 수집했을 경우
    items.push({ // 새로운 아이템 추가
      x: Math.random() * (canvas.width - 30), // 아이템의 x 위치 랜덤 설정
      y: 0, // 아이템의 y 위치 초기화
      width: 60, // 아이템의 너비
      height: 60, // 아이템의 높이
      dy: 2 // 아이템의 이동 속도
    });
    lastItemSpawn = now; // 마지막 아이템 생성 시간 업데이트
  }

  if (now - lastPotionSpawn > potionSpawnInterval) { // 포션 생성 간격이 지났을 경우
    potions.push({ // 새로운 포션 추가
      x: Math.random() * (canvas.width - 30), // 포션의 x 위치 랜덤 설정
      y: 0, // 포션의 y 위치 초기화
      width: 100, // 포션의 너비
      height: 100, // 포션의 높이
      dy: 2 // 포션의 이동 속도
    });
    lastPotionSpawn = now; // 마지막 포션 생성 시간 업데이트
  }

  requestAnimationFrame(update); // 다음 프레임 요청
}

function moveSpaceship(event) { // 우주선 이동 함수
  if (event.key === 'ArrowRight' && spaceship.x + spaceship.width < canvas.width) { // 오른쪽 화살표 키 누름
    spaceship.x += spaceship.dx; // 우주선 오른쪽 이동
  } else if (event.key === 'ArrowLeft' && spaceship.x > 0) { // 왼쪽 화살표 키 누름
    spaceship.x -= spaceship.dx; // 우주선 왼쪽 이동
  }
}

function increaseScore() { // 점수 증가 함수
  score++; // 점수 1 증가
}

function resetGame() { // 게임 리셋 함수
  spaceship.x = canvas.width / 2 - 25; // 우주선 초기 x 위치로 이동
  spaceship.y = canvas.height - 60; // 우주선 초기 y 위치로 이동
  bullets.length = 0; // 총알 배열 초기화
  enemies.length = 0; // 적 배열 초기화
  items.length = 0; // 아이템 배열 초기화
  potions.length = 0; // 포션 배열 초기화
  gameSpeed = 1; // 게임 속도 초기화
  gameOver = false; // 게임 오버 상태 초기화
  lives = 3; // 목숨 초기화
  score = 0; // 점수 초기화
  itemsCollected = 0; // 아이템 수집 개수 초기화
  bulletIntervalTime = 2000; // 총알 발사 간격 초기화
  clearInterval(gameInterval); // 기존 인터벌 제거
  gameInterval = setInterval(increaseScore, 1000); // 1초마다 점수 증가 인터벌 설정
  bulletInterval = setInterval(shootBullet, bulletIntervalTime); // 2초마다 총알 발사 인터벌 설정
  lastItemSpawn = Date.now(); // 마지막 아이템 생성 시간 초기화
  lastPotionSpawn = Date.now(); // 마지막 포션 생성 시간 초기화
  requestAnimationFrame(update); // 게임 업데이트 시작
}

document.addEventListener('keydown', moveSpaceship); // 키 다운 이벤트 리스너 추가