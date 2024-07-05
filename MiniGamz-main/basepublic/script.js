document.addEventListener('DOMContentLoaded', () => {
    const guessButton = document.getElementById('guessButton');
    const guessInput = document.getElementById('guessInput');
    const errorMessage = document.getElementById('errorMessage');
    const attemptsLeft = document.getElementById('attemptsLeft');
    const result = document.getElementById('result');
    const history = document.getElementById('history');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const retryButton = document.getElementById('retryButton');

    let answer = generateAnswer();
    let attempts = 10;

    guessButton.addEventListener('click', handleGuess);
    guessInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleGuess();
        }
    });

    retryButton.addEventListener('click', resetGame);

    function hasDuplicateDigits(number) {
        const digits = number.split('');
        const uniqueDigits = new Set(digits);
        return uniqueDigits.size !== digits.length;
    }

    function handleGuess() {
        const guess = guessInput.value;

        if (!isValidGuess(guess)) {
            showErrorMessage('4자리 숫자를 입력하세요.');
            return;
        }
        if (hasDuplicateDigits(guess)) {
            showErrorMessage('중복된 숫자가 있습니다. 다시 입력하세요.');
            return;
        }

        attempts--;
        attemptsLeft.textContent = `남은 횟수: ${attempts}`;
        const feedback = getFeedback(guess);

        if (feedback.strikes === 4) {
            result.textContent = '정답입니다! 당신이 이겼어요!';
            endGame();
        } else if (attempts === 0) {
            result.textContent = `게임 오버! 정답은 ${answer.join('')} 입니다.`;
            endGame();
        } else {
            addHistory(guess, feedback);
        }

        guessInput.value = '';
    }

    function generateAnswer() {
        const digits = [];
        while (digits.length < 4) {
            const digit = Math.floor(Math.random() * 10);
            if (!digits.includes(digit)) {
                digits.push(digit);
            }
        }
        return digits;
    }

    function isValidGuess(guess) {
        return /^\d{4}$/.test(guess);
    }

    function showErrorMessage(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }

    function getFeedback(guess) {
        const guessDigits = guess.split('').map(Number);
        let strikes = 0;
        let balls = 0;

        guessDigits.forEach((digit, index) => {
            if (digit === answer[index]) {
                strikes++;
            } else if (answer.includes(digit)) {
                balls++;
            }
        });

        return { strikes, balls };
    }

    function addHistory(guess, feedback) {
        const listItem = document.createElement('li');
        listItem.textContent = `입력한 숫자: ${guess}, 스트라이크: ${feedback.strikes}, 볼: ${feedback.balls}`;
        history.appendChild(listItem);
    }

    function endGame() {
        guessButton.disabled = true;
        guessInput.disabled = true;
        gameOverMessage.style.display = 'block';
    }

    function resetGame() {
        attempts = 10;
        answer = generateAnswer();
        attemptsLeft.textContent = `남은 횟수: ${attempts}`;
        result.textContent = '';
        history.innerHTML = '';
        guessButton.disabled = false;
        guessInput.disabled = false;
        gameOverMessage.style.display = 'none';
    }

    // Instructions toggle logic
    const toggleButton = document.getElementById('toggleButton');
    const instructionsContent = document.getElementById('instructionsContent');

    toggleButton.addEventListener('click', () => {
        if (instructionsContent.style.display === 'none') {
            instructionsContent.style.display = 'block';
            toggleButton.textContent = '▲';
        } else {
            instructionsContent.style.display = 'none';
            toggleButton.textContent = '▼';
        }
    });
});
