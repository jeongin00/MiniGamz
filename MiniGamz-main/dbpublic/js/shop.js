document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// 로그인 상태 확인
function checkLoginStatus() {
    fetch('/api/profile')
        .then(response => {
            if (response.ok) {
                response.json().then(data => {
                    document.getElementById('authMenu').innerHTML = `
                        <li class="auth-profile">
                            <img src="${data.profileImage}" alt="Profile Image">
                            <span>${data.nickname} (${data.points} 점)</span>
                        </li>
                        <li><a href="#" id="logoutLink">로그아웃</a></li>
                    `;
                    document.getElementById('logoutLink').addEventListener('click', logout);
                    
                    // Fetch purchased images
                    fetch('/api/purchased-images')
                        .then(response => response.json())
                        .then(purchasedData => {
                            const purchasedImages = purchasedData.purchasedImages;
                            updateButtons(data.points, purchasedImages);
                        })
                        .catch(error => {
                            console.error('Error fetching purchased images:', error);
                            updateButtons(data.points, []); // 업데이트할 이미지가 없을 때 빈 배열 전달
                        });
                });
            } else {
                document.getElementById('authMenu').innerHTML = `
                    <li><a href="login.html" id="loginLink">로그인</a></li>
                    <li><a href="signup.html" id="signupLink">회원가입</a></li>
                `;
            }
        })
        .catch(error => {
            console.error('Error checking login status:', error);
        });
}

// 로그아웃
function logout() {
    fetch('/logout', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                window.location.href = '/';
            } else {
                console.error('Logout failed');
            }
        })
        .catch(error => {
            console.error('Error logging out:', error);
        });
}

// 아이템 구매
function purchaseItem(button, type, value, cost) {
    fetch('/api/profile')
        .then(response => response.json())
        .then(profileData => {
            if (profileData.points >= cost) {
                fetch('/api/purchase-item', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type, value, cost })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('아이템이 성공적으로 구매되었습니다.');
                        button.parentElement.classList.remove('locked'); // 구매 성공 시 잠금 해제
                        checkLoginStatus(); // 구매 후 포인트 및 아이템 상태 업데이트
                    } else {
                        alert(data.error); // 아이템 실패 메시지 서버 문구로 대체
                    }
                })
                .catch(error => console.error('Error:', error));
            } else {
                alert('포인트가 부족합니다.');
            }
        })
        .catch(error => console.error('Error:', error));
}

// 버튼 상태 업데이트
function updateButtons(userPoints, purchasedItems) {
    const items = document.querySelectorAll('.profile-image-selector .item');

    items.forEach(item => {
        const imageUrl = item.getAttribute('data-img');
        const button = item.querySelector('button');
        const cost = parseInt(button.getAttribute('data-cost'), 10);

        if (purchasedItems.includes(imageUrl)) {
            item.classList.remove('locked'); // 이미 구매한 아이템의 잠금을 해제
            button.disabled = true; // 이미 구매한 아이템 버튼 비활성화
            button.innerText = '구매 완료';
            button.style.cursor = 'not-allowed';
        } else {
            button.disabled = false; // 버튼 항상 활성화
            button.style.cursor = 'pointer';
            button.onclick = () => purchaseItem(button, 'image', imageUrl, cost); // 클릭 이벤트 설정
        }
    });
}
