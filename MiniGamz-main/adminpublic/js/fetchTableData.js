document.addEventListener('DOMContentLoaded', () => {
    // 각 Table define
    const adminTableBody = document.querySelector('#datatablesSimple tbody');
    const userTableBody = document.querySelector('#userTable tbody');

    // 검색 필드 및 드롭다운 정의
    const searchCategoryAdmin = document.querySelector('#searchCategoryAdmin');
    const searchInputAdmin = document.querySelector('#searchInputAdmin');

    const searchCategoryUser = document.querySelector('#searchCategory');
    const searchInputUser = document.querySelector('#searchInput');

    // 데이터를 가져오는 함수
    async function fetchUserData() {
        try {
            // 데이터 가져오기
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // 테이블 초기화 및 데이터 추가
            populateTable(data);

            // 검색 이벤트 핸들러 추가
            if (searchCategoryAdmin && searchInputAdmin) {
                searchInputAdmin.addEventListener('input', () => filterTable(data, adminTableBody, 'admin'));
            }

            if (searchCategoryUser && searchInputUser) {
                searchInputUser.addEventListener('input', () => filterTable(data, userTableBody, 'user'));
            }

        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    function populateTable(data) {
        if (adminTableBody) {
            adminTableBody.innerHTML = '';
        }
        if (userTableBody) {
            userTableBody.innerHTML = '';
        }
        data.forEach(user => {
            if (adminTableBody) {
                // admin.html 테이블에 데이터 추가
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.password}</td>
                    <td>${user.name}</td>
                    <td>${user.nickname}</td>
                `;
                adminTableBody.appendChild(row);
            }
            if (userTableBody) {
                // user-list.html 테이블에 데이터 추가
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
                    <td><img src="${user.profileImage}" alt="Profile Image" width="50"></td>
                `;
                userTableBody.appendChild(row);
            }
        });
    }

    function filterTable(data, tableBody, type) {
        let searchTerm, category;
        if (type === 'admin') {
            searchTerm = searchInputAdmin.value.toLowerCase();
            category = searchCategoryAdmin.value;
        } else {
            searchTerm = searchInputUser.value.toLowerCase();
            category = searchCategoryUser.value;
        }

        const filteredData = data.filter(user =>
            !searchTerm || (user[category] && String(user[category]).toLowerCase().includes(searchTerm))
        );

        tableBody.innerHTML = '';
        filteredData.forEach(user => {
            if (type === 'admin') {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.password}</td>
                    <td>${user.name}</td>
                    <td>${user.nickname}</td>
                `;
                tableBody.appendChild(row);
            } else {
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
                    <td><img src="${user.profileImage}" alt="Profile Image" width="50"></td>
                `;
                tableBody.appendChild(row);
            }
        });
    }

    // 초기 데이터 가져오기 호출
    fetchUserData();
});
