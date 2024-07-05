document.addEventListener('DOMContentLoaded', () => {
    const userTableBody = document.querySelector('#userTable tbody');
    const searchCategory = document.querySelector('#searchCategory');
    const searchInput = document.querySelector('#searchInput');
    const searchButton = document.querySelector('#searchButton');
    const addUserButton = document.querySelector('#addUserButton');
    const userFormModal = document.querySelector('#userFormModal');
    const userForm = document.querySelector('#userForm');
    const deleteConfirmModal = document.querySelector('#deleteConfirmModal');
    let selectedUserId = null;

    async function fetchUserData() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            populateTable(data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    function populateTable(data) {
        userTableBody.innerHTML = '';
        data.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.password}</td>
                <td>${user.name}</td>
                <td>${user.nickname}</td>
                <td>${user.highschool}</td>
                <td>${user.person}</td>
                <td>${user.alias}</td>
                <td>${user.travel}</td>
                <td>${user.movie}</td>
                <td>${user.points}</td>
                <td><img src="${user.profileImage || '/default-profile.png'}" alt="Profile Image" width="50"></td>
                <td>
                    <button class="edit-button" data-id="${user.id}">수정</button>
                    <button class="delete-button" data-id="${user.id}">삭제</button>
                </td>
            `;
            userTableBody.appendChild(row);
        });

        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEditUser);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteUser);
        });
    }

    function filterTable(data) {
        const searchTerm = searchInput.value.toLowerCase();
        const category = searchCategory.value;
        const filteredData = data.filter(user =>
            !searchTerm || (user[category] && String(user[category]).toLowerCase().includes(searchTerm))
        );
        populateTable(filteredData);
    }

    function handleEditUser(event) {
        const userId = event.target.dataset.id;
        selectedUserId = userId;
        const user = Array.from(userTableBody.children).find(row => row.querySelector('button.edit-button').dataset.id === userId);
        if (user) {
            userForm.id.value = user.children[0].textContent;
            userForm.password.value = user.children[1].textContent;
            userForm.name.value = user.children[2].textContent;
            userForm.nickname.value = user.children[3].textContent;
            userForm.highschool.value = user.children[4].textContent;
            userForm.person.value = user.children[5].textContent;
            userForm.alias.value = user.children[6].textContent;
            userForm.travel.value = user.children[7].textContent;
            userForm.movie.value = user.children[8].textContent;
            userForm.points.value = user.children[9].textContent;
            userForm.profileImage.value = user.children[10].querySelector('img').src === '/default-profile.png' ? '' : user.children[10].querySelector('img').src;
            userFormModal.style.display = 'block';
        }
    }

    function handleDeleteUser(event) {
        const userId = event.target.dataset.id;
        selectedUserId = userId;
        deleteConfirmModal.style.display = 'block';
    }

    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(userForm);
        const userData = Object.fromEntries(formData.entries());

        // 필수 항목 유효성 검사 추가
        if (!userData.id || !userData.password || !userData.name || !userData.nickname) {
            alert('ID, PW, Name, Nickname은 필수 입력 항목입니다.');
            return;
        }

        // 선택 항목 중 하나는 반드시 입력해야 함
        if (!userData.highschool && !userData.person && !userData.alias && !userData.travel && !userData.movie) {
            alert('Highschool, Person, Alias, Travel, Movie 중 하나는 반드시 입력해야 합니다.');
            return;
        }

        // Profile Image URL이 비어 있으면 서버에 전송하지 않음
        if (!userData.profileImage) {
            delete userData.profileImage;
        }

        // 서버로 요청 전 유효성 검사
        if (userData.points === "") {
            userData.points = 0; // 기본값 설정
        }
        
        try {
            const response = await fetch(`/api/users/${selectedUserId || ''}`, {
                method: selectedUserId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchUserData();
            userFormModal.style.display = 'none';
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    });

    document.querySelectorAll('.modal .close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            userFormModal.style.display = 'none';
            deleteConfirmModal.style.display = 'none';
        });
    });

    document.querySelector('#confirmDeleteButton').addEventListener('click', async () => {
        try {
            const response = await fetch(`/api/users/${selectedUserId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchUserData();
            deleteConfirmModal.style.display = 'none';
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    });

    document.querySelector('#cancelDeleteButton').addEventListener('click', () => {
        deleteConfirmModal.style.display = 'none';
    });

    addUserButton.addEventListener('click', () => {
        selectedUserId = null;
        userForm.reset();
        userFormModal.style.display = 'block';
    });

    searchButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            filterTable(data);
        } catch (error) {
            console.error('Error searching user data:', error);
        }
    });

    fetchUserData();
});
