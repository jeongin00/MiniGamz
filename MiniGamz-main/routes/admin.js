const express = require('express');
const path = require('path');

const router = express.Router();

// adminpublic 폴더 서빙 부분
router.use('/', express.static(path.join(__dirname, '../adminpublic')));

// /admin 라우팅
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../adminpublic', 'admin.html'));
});

module.exports = router;
