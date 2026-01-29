const express = require('express');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

// Enable JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Empty for XAMPP
    database: 'easysnippet'
});

db.connect((err) => {
    if (err) console.error('Error connecting to MySQL:', err);
    else console.log('Connected to MySQL Database!');
});

// --- ROUTES ---

// 1. Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

// 2. Auth APIs
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    const sql = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Error registering" });
        res.json({ success: true, message: "User registered!" });
    });
});

app.post('/login-user', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length > 0) res.json({ success: true, user: results[0] });
        else res.json({ success: false, message: "Invalid credentials" });
    });
});

// 3. Snippet APIs (THIS WAS LIKELY MISSING)
app.post('/add-snippet', (req, res) => {
    const { userId, title, language, tags, code } = req.body;
    const sql = "INSERT INTO snippets (user_id, title, language, tags, code) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [userId, title, language, tags, code], (err, result) => {
        if (err) {
            console.error(err); // Log exact error to terminal
            return res.status(500).json({ success: false, message: "Error saving snippet" });
        }
        res.json({ success: true, message: "Snippet saved!" });
    });
});

app.get('/get-snippets/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT * FROM snippets WHERE user_id = ? ORDER BY id DESC";
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, snippets: results });
    });
});

// API: Delete a Snippet
// API: Soft Delete (Move to Trash)
app.post('/delete-snippet', (req, res) => {
    const { id } = req.body;
    // Instead of DELETE FROM, we update the flag
    const sql = "UPDATE snippets SET is_deleted = 1 WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, message: "Moved to Trash" });
    });
});

// API: Toggle Favorite
app.post('/toggle-favorite', (req, res) => {
    const { id } = req.body;
    // This flips the value (0 -> 1, or 1 -> 0)
    const sql = "UPDATE snippets SET is_favorite = NOT is_favorite WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, message: "Favorite updated" });
    });
});

// API: Permanent Delete (From Trash)
app.delete('/permanent-delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM snippets WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, message: "Snippet deleted permanently!" });
    });
});

// API: Edit Snippet
app.put('/update-snippet', (req, res) => {
    const { id, title, language, tags, code } = req.body;
    const sql = "UPDATE snippets SET title = ?, language = ?, tags = ?, code = ? WHERE id = ?";
    
    db.query(sql, [title, language, tags, code, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, message: "Snippet updated!" });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});