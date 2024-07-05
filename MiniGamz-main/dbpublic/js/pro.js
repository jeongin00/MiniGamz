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
                    document.getElementById('userName').innerText = data.name;
                    document.getElementById('userId').innerText = data.id;
                    document.getElementById('userNickname').innerText = data.nickname;
                    document.getElementById('userPoints').innerText = data.points;
                    document.getElementById('profileImage').src = data.profileImage;
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

function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    fetch('/api/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
    })
        .then(response => {
            if (response.ok) {
                alert('비밀번호가 성공적으로 변경되었습니다.');
            } else {
                alert('비밀번호 변경에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error changing password:', error);
            alert('비밀번호 변경 중 오류가 발생했습니다.');
        });
}

function selectProfileImage(imageUrl) {
    document.getElementById('profileImage').src = imageUrl;
    fetch('/api/change-profile-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileImage: imageUrl })
    })
        .then(response => {
            if (response.ok) {
                alert('프로필 이미지가 성공적으로 변경되었습니다.');
            } else {
                alert('프로필 이미지 변경에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error changing profile image:', error);
            alert('프로필 이미지 변경 중 오류가 발생했습니다.');
        });
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('newPassword');
    const toggleIcon = document.querySelector('.toggle-password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

function validatePassword() {
    const newPassword = document.getElementById('newPassword').value;

    if (!/^[A-Za-z0-9]{4,15}$/.test(newPassword)) {
        alert('패스워드는 4~15자리의 영어와 숫자만 가능합니다.');
        return false;
    }

    changePassword();
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});



//아이템샵 구매 시 프로필 설정가능하도록
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/purchased-images')
        .then(response => response.json())
        .then(data => {
            const purchasedImages = data.purchasedImages;
            const images = document.querySelectorAll('#profileImages .purchasable');
            images.forEach(img => {
                const imgSrc = new URL(img.src).pathname; // 절대 경로를 상대 경로로 변환
                if (!purchasedImages.includes(imgSrc)) {
                    img.classList.add('grayscale');
                } else {
                    img.onclick = () => selectProfileImage(imgSrc);
                }
            });
        })
        .catch(error => console.error('Error fetching purchased images:', error));
});

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/purchased-images')
        .then(response => response.json())
        .then(data => {
            const purchasedImages = data.purchasedImages;
            const images = document.querySelectorAll('#profileImages .purchasable');
            images.forEach(img => {
                const imgSrc = new URL(img.src).pathname; // 절대 경로를 상대 경로로 변환
                if (!purchasedImages.includes(imgSrc)) {
                    img.classList.add('grayscale');
                    img.onclick = () => promptPurchase(imgSrc);
                } else {
                    img.onclick = () => selectProfileImage(imgSrc);
                }
            });
        })
        .catch(error => console.error('Error fetching purchased images:', error));
});

function selectProfileImage(imageUrl) {
    console.log('Selected image:', imageUrl);
    fetch('/api/change-profile-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileImage: imageUrl })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('profileImage').src = imageUrl;
            alert('프로필 이미지가 성공적으로 변경되었습니다.');
        } else {
            alert('프로필 이미지 변경에 실패했습니다.');
        }
    })
    .catch(error => console.error('Error:', error));
}

function promptPurchase(imageUrl) {
    if (confirm('아이템을 구매하시겠습니까?')) {
        window.location.href = '/shop.html';
    }
}