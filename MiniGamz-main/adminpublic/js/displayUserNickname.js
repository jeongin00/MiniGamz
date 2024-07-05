document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 로그인 status check
        const loginCheckResponse = await fetch('/api/check-login', {
            method: 'GET',
            credentials: 'include'
        });
        const loginCheckData = await loginCheckResponse.json();

        // 로그인 상태가 아니면, 리다이렉트
        if (!loginCheckData.loggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // 로그인 상태라면, 사용자 정보 가져오기
        const response = await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        const userNicknameElement = document.getElementById('userNickname');
        userNicknameElement.textContent = userData.nickname;
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
});
