document.getElementById('upload-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch('/upload', {
        method: 'POST',
        body: formData
    }).then(response => response.text())
    .then(data => {
        alert(data);
        loadImages();
    });
});

document.getElementById('filter-form').addEventListener('change', function() {
    loadImages();
});

function loadImages() {
    fetch('/images')
    .then(response => response.json())
    .then(images => {
        const filters = Array.from(document.querySelectorAll('#filter-form input:checked')).map(cb => cb.name);
        const imagesSection = document.getElementById('images-section');
        imagesSection.innerHTML = '';
        images.filter(image => filters.includes(image.category)).forEach(image => {
            const article = document.createElement('article');
            article.innerHTML = `
                <img src="${image.image_url}" alt="${image.category}" />
                <h2>${image.title}</h2>
                <p class="categories" data-category="${image.category}">${image.category}</p>
                <div class="star-rating" data-image-id="${image.id}">
                    <div class="stars">
                        <label class="number"><input type="radio" name="rating" value="0"></label>
                        <label class="star"><input type="radio" name="rating" value="1"></label>
                        <label class="star"><input type="radio" name="rating" value="2"></label>
                        <label class="star"><input type="radio" name="rating" value="3"></label>
                        <label class="star"><input type="radio" name="rating" value="4"></label>
                        <label class="star"><input type="radio" name="rating" value="5"></label>
                        <div class="number-rating">${image.rating}</div>
                    </div>
                </div>
            `;
            imagesSection.appendChild(article);
        });
    });
}

document.addEventListener('change', function(e) {
    if (e.target.name === 'rating') {
        const rating = e.target.value;
        const imageId = e.target.closest('.star-rating').dataset.imageId;
        fetch('/rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageId, rating })
        }).then(response => response.text())
        .then(data => {
            alert(data);
            loadImages();
        });
    }
});

loadImages();
