document.getElementById('inquiry-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('문의 제출 완료.');
});

const socket = io();

socket.on('connect', () => {
    console.log('Socket 연결 됐음');
});

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('chat-message');
const usernameInput = document.getElementById('username');
const messages = document.getElementById('messages');
const chatContainer = document.getElementById('toggle-chat');
const toggleChatBtn = document.getElementById('toggle-chat-btn');
const openText = toggleChatBtn.dataset.openText;

toggleChatBtn.addEventListener('click', () => {
    const isVisible = chatContainer.style.display === 'block';
    chatContainer.style.display = isVisible ? 'none' : 'block';
    toggleChatBtn.textContent = isVisible ? openText : '닫기';
    toggleChatBtn.classList.toggle('small', !isVisible);
});
chatForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (!isLoggedIn) {  //로그인여부확인 팝업전송
        showLoginPopup();
        return;
    }
    const username = usernameInput.value.trim();
    const message = messageInput.value.trim();
    console.log(`전송 버튼 클릭됨. 유저명: ${username}, 메시지: ${message}`);
    if (username && message) {
        const fullMessage = `${username}: ${message}`;
        socket.emit('chat message', fullMessage);
        messageInput.value = '';
    } else {
        console.log('유저명, 메시지중 값이 비었음');
    }
});

socket.on('chat message', function(msg) {
    console.log(`받은 메시지: ${msg}`);
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
});
app.get('/api/profile', (req, res) => {
    if (req.session.user) {
        res.json({ nickname: req.session.user.nickname });
    } else {
        res.status(401).send('Not logged in');
    }
});
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Logout failed');
        }
        res.send('Logged out');
    });
    app.post('/login', (req, res) => {
        req.session.user = {
            nickname: '사용자 닉네임'
        };
        res.redirect('/');
    });
});

