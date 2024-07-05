app.get('/api/posts', (req, res) => {
    const sql = 'SELECT * FROM posts';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving posts from database:', err);
            res.status(500).send('Database error');
        } else {
            res.status(200).json(results);
        }
    });
});

