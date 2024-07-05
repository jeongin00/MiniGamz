const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'adminpublic'))); // 정적 파일 서빙 설정

// MySQL 연결 설정
const pool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'root',
    password: '00000000',
    database: 'user',
    debug: false
});

// 데이터베이스 및 테이블 생성 및 수정
pool.getConnection((err, conn) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
        return;
    }

    const createDatabaseQuery = `
    CREATE DATABASE IF NOT EXISTS user;
    `;

    const useDatabaseQuery = `
    USE user;
    `;

    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id varchar(100) NOT NULL COMMENT '사용자 로그인 아이디',
        name varchar(100) NOT NULL COMMENT '사용자의 이름',
        nickname varchar(100) DEFAULT NULL COMMENT '사용자의 닉네임',
        password varchar(300) NOT NULL COMMENT '로그인 암호, 패스워드',
        highschool varchar(300) DEFAULT NULL COMMENT '본인확인 고등학교',
        person varchar(300) DEFAULT NULL COMMENT '본인확인 인물',
        alias varchar(300) DEFAULT NULL COMMENT '본인확인 별명',
        travel varchar(300) DEFAULT NULL COMMENT '본인확인 여행',
        movie varchar(300) DEFAULT NULL COMMENT '본인확인 영화',
        profileImage varchar(300) DEFAULT 'NULL' COMMENT '프로필 이미지',
        points INT DEFAULT 0 COMMENT '사용자 포인트',
        PRIMARY KEY (id),
        UNIQUE KEY unique_nickname (nickname)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;

    const checkProfileImageColumnQuery = `
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'profileImage';
    `;

    const alterProfileImageColumnQuery = `
    ALTER TABLE users ADD COLUMN profileImage VARCHAR(300) DEFAULT 'NULL' COMMENT '프로필 이미지';
    `;
    
    const checkPointsColumnQuery = `
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'points';
    `;

    const alterPointsColumnQuery = `
    ALTER TABLE users ADD COLUMN points INT DEFAULT 0 COMMENT '사용자 포인트';
    `;

    // 구매한 프로필 저장하는 테이블 생성
    const createPurchasedImagesTableQuery = `
    CREATE TABLE IF NOT EXISTS purchase (
        user_id VARCHAR(100),
        image_url VARCHAR(255),
        color_url VARCHAR(255),
        PRIMARY KEY (user_id, image_url),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `;

    conn.query(createDatabaseQuery, (err) => {
        if (err) {
            console.error('데이터베이스 생성 실패:', err);
            return;
        }
        conn.query(useDatabaseQuery, (err) => {
            if (err) {
                console.error('데이터베이스 사용 실패:', err);
                return;
            }
            conn.query(createTableQuery, (err) => {
                if (err) {
                    console.error('테이블 생성 실패:', err);
                } else {
                    console.log('테이블 생성 성공!');
                }
                conn.query(checkProfileImageColumnQuery, (err, results) => {
                    if (err) {
                        console.error('프로필 이미지 컬럼 확인 실패:', err);
                        conn.release();
                    } else {
                        const count = results[0].count;
                        if (count === 0) {
                            conn.query(alterProfileImageColumnQuery, (err) => {
                                if (err) {
                                    console.error('프로필 이미지 컬럼 추가 실패:', err);
                                } else {
                                    console.log('프로필 이미지 컬럼 추가 성공!');
                                }
                            });
                        } else {
                            console.log('프로필 이미지 컬럼이 이미 존재합니다.');
                        }
                    }
                });
                conn.query(checkPointsColumnQuery, (err, results) => {
                    if (err) {
                        console.error('포인트 컬럼 확인 실패:', err);
                        conn.release();
                    } else {
                        const count = results[0].count;
                        if (count === 0) {
                            conn.query(alterPointsColumnQuery, (err) => {
                                if (err) {
                                    console.error('포인트 컬럼 추가 실패:', err);
                                } else {
                                    console.log('포인트 컬럼 추가 성공!');
                                }
                            });
                        } else {
                            console.log('포인트 컬럼이 이미 존재합니다.');
                        }
                    }
                });

                // 구매한 프로필 테이블 생성 쿼리 실행
                conn.query(createPurchasedImagesTableQuery, (err) => {
                    conn.release();
                    if (err) {
                        console.error('구매한 프로필 테이블 생성 실패:', err);
                    } else {
                        console.log('구매한 프로필 테이블 생성 성공!');
                    }
                });
            });
        });
    });
});

// 기존 API 엔드포인트 (DB에서 사용자 데이터 가져오기)
app.get('/api/users', (req, res) => {
    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: 'MySQL 연결 실패' });
        }

        const query = 'SELECT id, name, nickname, password, highschool, person, alias, travel, movie, profileImage, points FROM users';
        conn.query(query, (err, results) => {
            conn.release();
            if (err) {
                console.error('사용자 데이터 가져오기 실패:', err);
                return res.status(500).json({ error: '사용자 데이터 가져오기 실패' });
            }

            res.json(results);
        });
    });
});

// 신규 API 엔드포인트 (사용자 추가)
app.post('/api/users', (req, res) => {
    const { id, password, name, nickname, highschool, person, alias, travel, movie, points, profileImage } = req.body;

    // 필수 항목 유효성 검사
    if (!id || !password || !name || !nickname) {
        return res.status(400).json({ error: 'ID, PW, Name, Nickname은 필수 항목입니다.' });
    }

    // 선택 항목 중 하나는 반드시 입력해야 함
    if (!highschool && !person && !alias && !travel && !movie) {
        return res.status(400).json({ error: 'Highschool, Person, Alias, Travel, Movie 중 하나는 반드시 입력해야 합니다.' });
    }

    // Profile Image URL이 비어 있으면 기본 이미지로 설정
    const profileImageURL = profileImage || `http://${req.headers.host}/images/bob.webp`;

    const defaultPoints = points ? points : 0;

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: 'MySQL 연결 실패' });
        }
        const query = 'INSERT INTO users (id, password, name, nickname, highschool, person, alias, travel, movie, points, profileImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        conn.query(query, [id, password, name, nickname, highschool, person, alias, travel, movie, defaultPoints, profileImageURL], (err) => {
            conn.release();
            if (err) {
                console.error('사용자 추가 실패:', err);
                return res.status(500).json({ error: '사용자 추가 실패' });
            }
            res.status(201).json({ success: true });
        });
    });
});

// 신규 API 엔드포인트 (사용자 수정)
app.put('/api/users/:id', (req, res) => {
    const { id, password, name, nickname, highschool, person, alias, travel, movie, points, profileImage } = req.body;
    const userId = req.params.id;

    // 필수 항목 유효성 검사
    if (!id || !password || !name || !nickname) {
        return res.status(400).json({ error: 'PW, Name, Nickname은 필수 항목입니다.' });
    }

    // 선택 항목 중 하나는 반드시 입력해야 함
    if (!highschool && !person && !alias && !travel && !movie) {
        return res.status(400).json({ error: 'Highschool, Person, Alias, Travel, Movie 중 하나는 반드시 입력해야 합니다.' });
    }

    // Profile Image URL이 비어 있으면 기본 이미지로 설정
    const profileImageURL = profileImage || `http://${req.headers.host}/images/bob.webp`;

    const defaultPoints = points ? points : 0;

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: 'MySQL 연결 실패' });
        }
        const query = 'UPDATE users SET password = ?, name = ?, nickname = ?, highschool = ?, person = ?, alias = ?, travel = ?, movie = ?, points = ?, profileImage = ? WHERE id = ?';
        conn.query(query, [password, name, nickname, highschool, person, alias, travel, movie, defaultPoints, profileImageURL, userId], (err) => {
            conn.release();
            if (err) {
                console.error('사용자 수정 실패:', err);
                return res.status(500).json({ error: '사용자 수정 실패' });
            }
            res.status(200).json({ success: true });
        });
    });
});

// 신규 API 엔드포인트 (사용자 삭제)
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: 'MySQL 연결 실패' });
        }
        const query = 'DELETE FROM users WHERE id = ?';
        conn.query(query, [userId], (err) => {
            conn.release();
            if (err) {
                console.error('사용자 삭제 실패:', err);
                return res.status(500).json({ error: '사용자 삭제 실패' });
            }
            res.status(200).json({ success: true });
        });
    });
});

// 커뮤니티 게시판 DB 설정
app.use(bodyParser.json());
app.use(cors());

const ddb = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '00000000',
    database: 'post'
});

ddb.connect((err) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
        return;
    }
    console.log('MySQL 연결 성공!');

    const createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS post;';
    const useDatabaseQuery = 'USE post;';
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS img (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '게시글 ID',
            author VARCHAR(100) NOT NULL COMMENT '작성자',
            title VARCHAR(100) NOT NULL COMMENT '제목',
            content TEXT NOT NULL COMMENT '문의내용',
            date DATETIME NOT NULL COMMENT '날짜',
            views INT Null default 0 COMMENT '조회수'
        ) COMMENT='게시글 테이블';
    `;

    ddb.query(createDatabaseQuery, (err) => {
        if (err) {
            console.error('데이터베이스 생성 실패:', err);
            return;
        }
        ddb.query(useDatabaseQuery, (err) => {
            if (err) {
                console.error('데이터베이스 선택 실패:', err);
                return;
            }
            ddb.query(createTableQuery, (err) => {
                if (err) {
                    console.error('테이블 생성 실패:', err);
                }
            });
        });
    });

    const createCommentTableQuery = `
        CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '댓글 ID',
            postId INT NOT NULL COMMENT '게시글 ID',
            author VARCHAR(100) NOT NULL COMMENT '작성자',
            content TEXT NOT NULL COMMENT '댓글 내용',
            date DATETIME NOT NULL COMMENT '작성 날짜',
            FOREIGN KEY (postId) REFERENCES img(id)
        ) COMMENT='댓글 테이블';
    `;

    ddb.query(createCommentTableQuery, (err) => {
        if (err) {
            console.error('댓글 테이블 생성 실패:', err);
        }
    });
});

app.post('/api/img', (req, res) => {
    const { title, author, content, date, views } = req.body;
    const newPost = { title, author, content, date, views };

    const insertPostQuery = 'INSERT INTO img (title, author, content, date, views) VALUES (?, ?, ?, ?, ?)';
    const updatePointsQuery = 'UPDATE user.users SET points = points + 10 WHERE nickname = ?';

    ddb.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).send('Database transaction error');
        }

        ddb.query(insertPostQuery, [title, author, content, date, views], (err, result) => {
            if (err) {
                return ddb.rollback(() => {
                    console.error('Error inserting post:', err);
                    res.status(500).send('Database error inserting post');
                });
            }

            ddb.query(updatePointsQuery, [author], (err, result) => {
                if (err) {
                    return ddb.rollback(() => {
                        console.error('Error updating user points:', err);
                        res.status(500).send('Database error updating points');
                    });
                }

                ddb.commit(err => {
                    if (err) {
                        return ddb.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).send('Database commit error');
                        });
                    }

                    console.log('1 record inserted and points updated');
                    res.status(201).send('Post added and points updated');
                });
            });
        });
    });
});


app.put('/api/updatePoints', (req, res) => {
    const { points } = req.body;
    const updatePointsQuery = 'UPDATE users SET points = points + ? WHERE nickname = ?';

    if (!req.user || !req.user.nickname) {
        return res.status(401).send('Unauthorized');
    }

    ddb.query(updatePointsQuery, [points, req.user.nickname], (err, result) => {
        if (err) {
            console.error('Error updating points:', err);
            return res.status(500).send('Database error');
        }
        res.status(200).send('Points updated successfully');
    });
});

app.get('/api/img', (req, res) => {
    const fetchPostsQuery = 'SELECT * FROM img ORDER BY id DESC';

    ddb.query(fetchPostsQuery, (err, results) => {
        if (err) {
            console.error('Error fetching posts:', err);
            return res.status(500).send('Database error');
        }
        res.status(200).json(results);
    });
});

app.get('/api/img/:postId/comments', (req, res) => {
    const postId = req.params.postId;
    const fetchCommentsQuery = 'SELECT * FROM comments WHERE postId = ? ORDER BY id DESC';

    ddb.query(fetchCommentsQuery, [postId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).send('Database error');
        }
        res.status(200).json(results);
    });
});

app.post('/api/img/:postId/comments', (req, res) => {
    const postId = req.params.postId;
    const { author, content, date } = req.body;
    const insertCommentQuery = 'INSERT INTO comments (postId, author, content, date) VALUES (?, ?, ?, ?)';
    const updatePointsQuery = 'UPDATE user.users SET points = points + 5 WHERE nickname = ?';

    ddb.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).send('Database transaction error');
        }

        ddb.query(insertCommentQuery, [postId, author, content, date], (err, result) => {
            if (err) {
                return ddb.rollback(() => {
                    console.error('Error inserting comment:', err);
                    res.status(500).send('Database error inserting comment');
                });
            }

            ddb.query(updatePointsQuery, [author], (err, result) => {
                if (err) {
                    return ddb.rollback(() => {
                        console.error('Error updating user points:', err);
                        res.status(500).send('Database error updating points');
                    });
                }

                ddb.commit(err => {
                    if (err) {
                        return ddb.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).send('Database commit error');
                        });
                    }

                    console.log('Comment added and points updated');
                    res.status(201).send('Comment added successfully and points updated');
                });
            });
        });
    });
});

app.put('/api/img/:postId/views', (req, res) => {
    const postId = req.params.postId;
    const updateViewsQuery = 'UPDATE img SET views = views + 1 WHERE id = ?';

    ddb.query(updateViewsQuery, [postId], (err, result) => {
        if (err) {
            console.error('Error updating views:', err);
            return res.status(500).send('Database error');
        }
        res.status(200).send('Views updated successfully');
    });
});

app.delete('/api/img/:id', (req, res) => {
    const postId = req.params.id;
    const deletePostQuery = 'DELETE FROM img WHERE id = ?';

    ddb.query(deletePostQuery, [postId], (err, result) => {
        if (err) {
            console.error('Error deleting post:', err);
            return res.status(500).send('Database error');
        }
        res.status(200).send('Post deleted successfully');
    });
});

//문의게시판
// 문의 게시판 DB 설정

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MySQL DB 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '00000000',
    database: 'post'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
        return;
    }
    console.log('MySQL 연결 성공!');

    const createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS post;';
    const useDatabaseQuery = 'USE post;';
    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(100) NOT NULL COMMENT '사용자 로그인 아이디',
            name VARCHAR(100) NOT NULL COMMENT '사용자의 이름',
            nickname VARCHAR(100) DEFAULT NULL COMMENT '사용자의 닉네임',
            password VARCHAR(300) NOT NULL COMMENT '로그인 암호, 패스워드',
            highschool VARCHAR(300) DEFAULT NULL COMMENT '본인확인 고등학교',
            person VARCHAR(300) DEFAULT NULL COMMENT '본인확인 인물',
            alias VARCHAR(300) DEFAULT NULL COMMENT '본인확인 별명',
            travel VARCHAR(300) DEFAULT NULL COMMENT '본인확인 여행',
            movie VARCHAR(300) DEFAULT NULL COMMENT '본인확인 영화',
            profileImage VARCHAR(300) DEFAULT NULL COMMENT '프로필 이미지',
            points INT DEFAULT 0 COMMENT '사용자 포인트',
            PRIMARY KEY (id),
            UNIQUE KEY unique_nickname (nickname)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;
    const createPostsTableQuery = `
        CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '게시글 ID',
            author VARCHAR(100) NOT NULL COMMENT '작성자 닉네임',
            title VARCHAR(100) NOT NULL COMMENT '제목',
            content TEXT NOT NULL COMMENT '문의내용',
            date DATETIME NOT NULL COMMENT '날짜'
        ) COMMENT='게시글 테이블';
    `;

    db.query(createDatabaseQuery, (err) => {
        if (err) {
            console.error('데이터베이스 생성 실패:', err);
            return;
        }
        db.query(useDatabaseQuery, (err) => {
            if (err) {
                console.error('데이터베이스 사용 실패:', err);
                return;
            }
            db.query(createUsersTableQuery, (err) => {
                if (err) {
                    console.error('사용자 테이블 생성 실패:', err);
                    return;
                }
                db.query(createPostsTableQuery, (err) => {
                    if (err) {
                        console.error('게시글 테이블 생성 실패:', err);
                    } else {
                        console.log('테이블 생성 성공!');
                    }
                });
            });
        });
    });
});
// 게시글 조회
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

// 게시글 추가
app.post('/api/posts', (req, res) => {
    const { title, author, content, date } = req.body;
    const sql = 'INSERT INTO posts (title, author, content, date) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, author, content, date], (err, result) => {
        if (err) {
            console.error('Error adding post to database:', err);
            res.status(500).send('Database error');
        } else {
            console.log('1 record inserted');
            res.status(201).send('Post added');
        }
    });
});

// 게시글 수정
app.put('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const { title, author, content, date } = req.body;
    const sql = 'UPDATE posts SET title = ?, author = ?, content = ?, date = ? WHERE id = ?';
    db.query(sql, [title, author, content, date, postId], (err, result) => {
        if (err) {
            console.error('Error updating post in database:', err);
            res.status(500).send('Database error');
        } else if (result.affectedRows === 0) {
            res.status(404).send('Post not found');
        } else {
            res.status(200).send('Post updated successfully');
        }
    });
});

// 게시글 삭제
app.delete('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const sql = 'DELETE FROM posts WHERE id = ?';
    db.query(sql, [postId], (err, result) => {
        if (err) {
            console.error('Error deleting post from database:', err);
            res.status(500).send('Database error');
        } else if (result.affectedRows === 0) {
            res.status(404).send('Post not found');
        } else {
            res.status(200).send('Post deleted successfully');
        }
    });
});





// 사진게시판 파일 업로드 설정

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const dbb = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '00000000',
  database: 'user'
});

dbb.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected...');
});
app.use(session({  //세션 가져오기
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS 환경에서는 true로 설정
  }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads')); // 절대 경로로 변경
  },
  filename: (req, file, cb) => {
    const title = req.body.title.replace(/\s+/g, '-'); // 제목의 공백을 대시(-)로 변경
    const ext = path.extname(file.originalname); // 파일 확장자 추출
    cb(null, `${title}-${Date.now()}${ext}`); // 파일 이름에 타임스탬프 추가
  }
});

const upload = multer({ storage: storage });

let images = [];

app.post('/upload', (req, res) => {
    if (!req.session.user) {
      return res.status(401).send('Unauthorized: Please log in to upload images.');
    }
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(500).send('Error uploading image.');
      }
      const { title, category } = req.body;
      const image = {
        id: Date.now().toString(),
        image_url: `/uploads/${req.file.filename}`,
        category: category,
        title: title,
        rating: 0
      };
      images.push(image);
      res.send('Image uploaded successfully!');
    });
  });
  

app.get('/images', (req, res) => {
  res.json(images);
});

app.post('/rate', (req, res) => { // (3)
    const { imageId, rating } = req.body;
    if (!req.session.user) { // (4)
      return res.status(401).send('Unauthorized');
    }
    const image = images.find(img => img.id === imageId);
    if (image) {
      image.rating = rating;
  
      const updateUserPointsQuery = `
        UPDATE users
        SET points = points + ?
        WHERE id = ?
      `;
        
      dbb.query(updateUserPointsQuery, [rating, req.session.user.id], (err, result) => {
        if (err) {
          res.status(500).send('Error updating user points!');
          return;
        }
        res.send('Rating updated and user points updated successfully!');
      });
    } else {
      res.status(404).send('Image not found!');
    }
  });
  app.post('/login', (req, res) => { // (5)
    const { id, password } = req.body;
    const loginQuery = `
      SELECT * FROM users
      WHERE id = ? AND password = ?
    `;
    dbb.query(loginQuery, [id, password], (err, results) => {
      if (err) {
        res.status(500).send('Error logging in!');
        return;
      }
      if (results.length > 0) {
        req.session.user = results[0];
        res.send('Login successful!');
      } else {
        res.status(401).send('Invalid credentials');
      }
    });
  });
  
  app.get('/logout', (req, res) => { // (6)
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error logging out!');
      }
      res.send('Logout successful!');
    });
  });
  
  app.get('/session', (req, res) => { // (7)
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).send('No session');
    }
  });

  //ranking게시판

// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '00000000',
    database: 'user'
});

// MySQL 연결
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        return;
    }
    console.log('Connected to MySQL');
});

// 정적 파일 제공
app.use(express.static('public'));

// 랭킹 데이터 가져오기
app.get('/ranking', (req, res) => {
    const query = 'SELECT points, nickname, profileImage FROM users ORDER BY points DESC';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching data: ', error);
            res.status(500).send('Server Error');
            return;
        }
        res.json(results);
    });
});


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'mainpublic')));
app.use(express.static(path.join(__dirname, 'basepublic')));
app.use(express.static(path.join(__dirname, 'dbpublic')));
app.use(express.static(path.join(__dirname, 'minion-bird-public/public')));
app.use(express.static(path.join(__dirname, 'shootingpublic')));
app.use(express.static(path.join(__dirname, 'minion-jump-public')));
app.use(express.static(path.join(__dirname, '2048public')));
app.use(express.static(path.join(__dirname, 'runningpublic')));

// admin 라우터 불러오는 부분
const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter); // admin 라우터 사용

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mainpublic/html', 'index.html'));
});
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dbpublic/html', 'login.html'));
});
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dbpublic/html', 'adduser.html'));
});
app.get('/baseball.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'basepublic/html', 'baseball.html'));
});
app.get('/shooting', (req, res) => {
    res.sendFile(path.join(__dirname, 'shootingpublic/html', 'shooting.html'));
});
app.get('/minionbird.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'minion-bird-public/public/html', 'minionbird.html'));
});
app.get('/minionjump', (req, res) => {
    res.sendFile(path.join(__dirname, 'minion-jump-public', 'minionjump.html'));
});
app.get('/2048', (req, res) => {
    res.sendFile(path.join(__dirname, '2048public', '2048.html'));
});
app.get('/minionrun.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'runningpublic', 'minionrun.html'));
});
app.get('/inquiry.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'inquiry/html', 'inquiry.html'));
});
app.get('/community.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'community/html', 'community.html'));
});
app.get('/free.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'free/html', 'free.html'));
});
app.get('/pic.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pic', 'pic.html'));
});
app.get('/ranking.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ranking/html', 'ranking.html'));
});
app.get('/find.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dbpublic/html', 'find.html'));
});
app.get('/profile.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'dbpublic/html', 'profile.html'));
    } else {
        res.redirect('/login.html?redirectUrl=/profile.html');
    }
});
app.get('/shop.html', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'dbpublic/html', 'shop.html'));
    } else {
        res.redirect('/login.html?redirectUrl=/shop.html');
    }
});
// 로그인 상태 확인 API
app.get('/api/check-login', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(200).json({ loggedIn: false });
    }
});

app.post('/guess', (req, res) => {
    const { guess } = req.body;
    const result = getHint(guess, targetNumber);
    res.json({ ...result, targetNumber });
});

app.post('/newgame', (req, res) => {
    targetNumber = generateRandomNumber();
    res.sendStatus(200);
});

function getHint(guess, target) {
    let strikes = 0;
    let balls = 0;
    for (let i = 0; guess && i < guess.length; i++) {
        if (guess[i] === target[i]) {
            strikes++;
        } else if (target.includes(guess[i])) {
            balls++;
        }
    }
    return { strikes, balls };
}

io.on('connection', (socket) => {
    console.log('새 사용자 접속!');

    socket.on('disconnect', () => {
        console.log('사용자 접속 종료!');
    });

    socket.on('chat message', (msg) => {
        console.log(`받은 메시지: ${msg}`);
        io.emit('chat message', msg);
    });
});

app.post('/process/login', (req, res) => {
    console.log('/process/login 호출됨' + req);
    const paramId = req.body.id;
    const paramPassword = req.body.password;
    const redirectUrl = req.body.redirectUrl || '/';

    console.log('로그인 요청' + paramId + '' + paramPassword);

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('Mysql getConnection error. aborted');
            res.status(500).json({ error: 'DB서버 연결 실패' });
            return;
        }
        const exec = conn.query('SELECT `id`, `name`, `nickname`, `profileImage`, `points` FROM `users` WHERE `id`=? AND `password`=?',
            [paramId, paramPassword],
            (err, rows) => {
                conn.release();
                console.log('실행된 SQL query: ' + exec.sql);

                if (err) {
                    console.dir(err);
                    res.status(500).json({ error: 'SQL query 실행 실패' });
                    return;
                }

                if (rows.length > 0) {
                    const user = rows[0];
                    if (user.points === null) {
                        user.points = 0;
                    }
                    console.log('아이디[%s], 패스워드가 일치하는 사용자 [%s] 찾음', paramId, user.name);
                    req.session.user = { id: user.id, name: user.name, nickname: user.nickname, profileImage: user.profileImage, points: user.points }; // 세션에 사용자 정보 저장
                    res.json({ success: true, redirectUrl: redirectUrl });    // 로그인 성공 시 JSON 응답으로 성공 여부와 리디렉션 URL 반환
                } else {
                    console.log('아이디[%s], 패스워드가 일치없음', paramId);
                    res.status(401).json({ success: false, error: '로그인 실패ㅠㅠ 아이디와 패스워드를 확인하세요.' });
                }
            }
        );
    });
});

app.post('/process/checknickname', (req, res) => {
    const nickname = req.body.nickname;

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('Mysql getConnection error:', err);
            res.status(500).send('서버 에러');
            return;
        }

        conn.query('SELECT * FROM users WHERE nickname = ?', nickname, (err, rows) => {
            conn.release();

            if (err) {
                console.log('Mysql query error:', err);
                res.status(500).send('서버 에러');
                return;
            }

            if (rows.length > 0) {
                res.send('duplicate');
            } else {
                res.send('not_duplicate');
            }
        });
    });
});

app.post('/process/checkduplicate', (req, res) => {
    const userId = req.body.id;

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('Mysql getConnection error:', err);
            res.status(500).send('서버 에러');
            return;
        }

        conn.query('SELECT * FROM users WHERE id = ?', userId, (err, rows) => {
            conn.release();

            if (err) {
                console.log('Mysql query error:', err);
                res.status(500).send('서버 에러');
                return;
            }

            if (rows.length > 0) {
                res.send('duplicate');
            } else {
                res.send('not_duplicate');
            }
        });
    });
});

app.post('/process/adduser', (req, res) => {
    console.log('/process/adduser 호출됨');
    const { nickname, name, id, password, highschool, person, alias, travel, movie } = req.body;
    // 아이디 자릿수 제한 제거, 영어와 숫자만 체크
    if (!/^[A-Za-z0-9]{4,15}/.test(id)) {
        return res.json({ success: false, message: '아이디는 패스워드는 4~15자리의 영어와 숫자만 가능합니다.' });
    }

    // 비밀번호 자릿수 제한 유지
    if (!/^[A-Za-z0-9]{4,15}$/.test(password)) {
        return res.json({ success: false, message: '패스워드는 4~15자리의 영어와 숫자만 가능합니다.' });
    }
    pool.getConnection((err, conn) => {
        if (err) {
            console.log('Mysql getConnection error. aborted');
            res.status(500).json({ success: false, message: 'DB서버 연결 실패' });
            return;
        }
        const exec = conn.query(
            'INSERT INTO users (nickname, name, id, password, highschool, person, alias, travel, movie) VALUES (?,?,?,?,?,?,?,?,?);',
            [nickname, name, id, password, highschool, person, alias, travel, movie],
            (err, result) => {
                conn.release();
                console.log('실행된 SQL: ' + exec.sql);

                if (err) {
                    console.log('SQL 실행시 오류 발생');
                    console.dir(err);
                    res.status(500).json({ success: false, message: '다시 시도해주세요' });
                    return;
                }

                if (result) {
                    console.dir(result);
                    console.log('Inserted 성공');
                    res.status(200).json({ success: true, message: '회원가입 성공!', redirectUrl: '/' });
                } else {
                    console.log('Inserted 실패');
                    res.status(500).json({ success: false, message: '회원가입 실패ㅜㅜ' });
                }
            }
        );
    });
});

app.post('/process/findid', (req, res) => {
    const { name, securityQuestion, securityAnswer } = req.body;

    // 보안 질문에 해당하는 컬럼명을 미리 정의된 목록에서 검증
    const validSecurityQuestions = ['highschool', 'person', 'alias', 'travel', 'movie'];
    if (!validSecurityQuestions.includes(securityQuestion)) {
        res.status(400).json({ success: false, message: '유효하지 않은 보안 질문입니다.' });
        return;
    }

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('Mysql getConnection error:', err);
            res.status(500).send('서버 에러');
            return;
        }

        const query = `SELECT id FROM users WHERE name = ? AND ${securityQuestion} = ?`;
        conn.query(query, [name, securityAnswer], (err, rows) => {
            conn.release();

            if (err) {
                console.log('Mysql query error:', err);
                res.status(500).send('서버 에러');
                return;
            }

            if (rows.length > 0) {
                res.status(200).json({ success: true, id: rows[0].id });
            } else {
                res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }
        });
    });
});

// 비밀번호 찾기
app.post('/process/findpassword', (req, res) => {
    const { name, id } = req.body;

    pool.getConnection((err, conn) => {
        if (err) {
            console.log('Mysql getConnection error:', err);
            res.status(500).send('서버 에러');
            return;
        }

        const query = 'SELECT password FROM users WHERE name = ? AND id = ?';
        conn.query(query, [name, id], (err, rows) => {
            conn.release();

            if (err) {
                console.log('Mysql query error:', err);
                res.status(500).send('서버 에러');
                return;
            }

            if (rows.length > 0) {
                res.status(200).json({ success: true, password: rows[0].password });
            } else {
                res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }
        });
    });
});

app.get('/api/profile', (req, res) => { // 프로필 정보 API
    if (req.session.user) {
        const userId = req.session.user.id;
        pool.getConnection((err, conn) => {
            if (err) {
                return res.status(500).json({ error: '서버 에러' });
            }
            const query = 'SELECT id, name, nickname, profileImage, points FROM users WHERE id = ?';
            conn.query(query, [userId], (err, rows) => {
                conn.release();
                if (err) {
                    return res.status(500).json({ error: '쿼리 실행 실패' });
                }
                if (rows.length > 0) {
                    const user = rows[0];
                    if (user.points === null) {
                        user.points = 0;
                    }
                    req.session.user = user; // 세션 업데이트
                    res.json(user);
                } else {
                    res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
                }
            });
        });
    } else {
        res.status(401).json({ error: '사용자가 로그인하지 않았습니다.' });
    }
});

// 비밀번호 변경
app.post('/api/change-password', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '로그인 상태가 아닙니다.' });
    }

    const { newPassword } = req.body;
    const userId = req.session.user.id;

    // 비밀번호 형식 검증
    if (!/^[A-Za-z0-9]{4,15}$/.test(newPassword)) {
        return res.status(400).json({ error: '패스워드는 4~15자리의 영어와 숫자만 가능합니다.' });
    }

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: '서버 에러' });
        }

        const query = 'UPDATE users SET password = ? WHERE id = ?';
        conn.query(query, [newPassword, userId], (err, result) => {
            conn.release();
            if (err) {
                console.error('비밀번호 변경 실패:', err);
                return res.status(500).json({ error: '비밀번호 변경 실패' });
            }
            res.json({ success: true });
        });
    });
});

app.post('/api/change-profile-image', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '로그인 상태가 아닙니다.' });
    }

    const { profileImage } = req.body;
    const userId = req.session.user.id;

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: '서버 에러' });
        }

        const query = 'UPDATE users SET profileImage = ? WHERE id = ?';
        conn.query(query, [profileImage, userId], (err, result) => {
            conn.release();
            if (err) {
                console.error('프로필 이미지 변경 실패:', err);
                return res.status(500).json({ error: '프로필 이미지 변경 실패' });
            }
            req.session.user.profileImage = profileImage; // 세션에 저장된 프로필 이미지 업데이트
            res.json({ success: true });
        });
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: '로그아웃 실패' });
        }
        res.redirect('/');
    });
});

app.post('/api/purchase-item', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '로그인 상태가 아닙니다.' });
    }

    const { type, value, cost } = req.body;
    const userId = req.session.user.id;

    if (!cost || isNaN(cost) || cost <= 0) {
        return res.status(400).json({ error: '유효하지 않은 비용입니다.' });
    }

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: '서버 에러' });
        }

        // 이미 구매한 아이템인지 확인
        const queryCheck = 'SELECT COUNT(*) AS count FROM purchase WHERE user_id = ? AND image_url = ?';
        conn.query(queryCheck, [userId, value], (err, results) => {
            if (err) {
                conn.release();
                console.error('아이템 확인 실패:', err);
                return res.status(500).json({ error: '아이템 확인 실패' });
            }

            if (results[0].count > 0) {
                conn.release();
                return res.status(400).json({ error: '이미 구매한 아이템입니다.' });
            }

            // 사용자 포인트 조회 및 차감
            const querySelect = 'SELECT points FROM users WHERE id = ?';
            conn.query(querySelect, [userId], (err, rows) => {
                if (err) {
                    conn.release();
                    console.error('포인트 조회 실패:', err);
                    return res.status(500).json({ error: '포인트 조회 실패' });
                }

                const userPoints = rows[0].points;
                if (userPoints < cost) {
                    conn.release();
                    return res.status(400).json({ error: '포인트가 부족합니다.' });
                }

                const queryUpdate = 'UPDATE users SET points = points - ? WHERE id = ?';
                conn.query(queryUpdate, [cost, userId], (err) => {
                    if (err) {
                        conn.release();
                        console.error('포인트 차감 실패:', err);
                        return res.status(500).json({ error: '포인트 차감 실패' });
                    }

                    // 구매한 아이템을 데이터베이스에 저장
                    const queryInsert = 'INSERT INTO purchase (user_id, image_url) VALUES (?, ?)';
                    conn.query(queryInsert, [userId, value], (err) => {
                        conn.release();
                        if (err) {
                            console.error('아이템 저장 실패:', err);
                            return res.status(500).json({ error: '아이템 저장 실패' });
                        }

                        res.json({ success: true });
                    });
                });
            });
        });
    });
});

// 아이템샵에서 이미지 구매
app.get('/api/purchased-images', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '로그인 상태가 아닙니다.' });
    }

    const userId = req.session.user.id;

    pool.getConnection((err, conn) => {
        if (err) {
            console.error('MySQL 연결 실패:', err);
            return res.status(500).json({ error: '서버 에러' });
        }

        const querySelect = 'SELECT image_url FROM purchase WHERE user_id = ?';
        conn.query(querySelect, [userId], (err, rows) => {
            conn.release();
            if (err) {
                console.error('구매한 이미지 조회 실패:', err);
                return res.status(500).json({ error: '구매한 이미지 조회 실패' });
            }

            const purchasedImages = rows.map(row => row.image_url);
            res.json({ purchasedImages });
        });
    });
});

// 서버 설정
server.listen(PORT, () => {
    console.log(`http://localhost:${PORT} 에서 실행 중..`);
});
