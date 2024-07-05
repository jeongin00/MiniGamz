document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutBtn").addEventListener("click", function(event) {
        event.preventDefault(); // 기본 동작 막기
        fetch("/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.ok) {
                alert("로그아웃 되었습니다.");
                window.location.href = "/login.html"; // 성공 시 로그인 페이지로 리디렉션
            } else {
                alert("로그아웃에 실패했습니다.");
            }
        }).catch(error => {
            console.error("로그아웃 요청 오류:", error);
        });
    });
});
