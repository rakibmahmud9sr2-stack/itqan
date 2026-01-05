const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const fs = require('fs');
const cors = require('cors');

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
    credentials: true
}));

// Middleware to parse cookies (Moved to top)
app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            req.cookies[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    next();
});

// Data File Path
const dataPath = path.join(__dirname, 'data', 'posts.json');

// API: Get All Posts
app.get('/api/posts', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading data' });
        }
        res.json(JSON.parse(data));
    });
});

// API: Add New Post
app.post('/api/posts', (req, res) => {
    const newPost = req.body;

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading data' });
        }

        const posts = JSON.parse(data);
        newPost.id = Date.now(); // Simple ID generation
        posts.push(newPost);

        fs.writeFile(dataPath, JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving data' });
            }
            res.json({ message: 'Post added successfully', post: newPost });
        });
    });
});

// Data File Paths
const userDataPath = path.join(__dirname, 'data', 'users.json');
const messageDataPath = path.join(__dirname, 'data', 'messages.json');
const orderDataPath = path.join(__dirname, 'data', 'orders.json');

// Multer Setup for File Uploads
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Serve Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Users API ---
app.get('/api/users', (req, res) => {
    fs.readFile(userDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading users' });
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            console.error('Error parsing users.json:', e);
            res.json([]); // Return empty array on error instead of crashing
        }
    });
});

app.post('/api/users', (req, res) => {
    const newUser = req.body;
    fs.readFile(userDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading users' });
        const users = JSON.parse(data);
        newUser.id = Date.now();
        newUser.date = new Date().toISOString().split('T')[0];
        users.push(newUser);
        fs.writeFile(userDataPath, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error saving user' });
            res.json({ message: 'User registered' });
        });
    });
});

app.delete('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    fs.readFile(userDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading users' });
        let users = JSON.parse(data);
        users = users.filter(u => u.id !== id);
        fs.writeFile(userDataPath, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error deleting user' });
            res.json({ message: 'User deleted' });
        });
    });
});

// --- Messages API ---
app.get('/api/messages', (req, res) => {
    console.log('Reading messages from:', messageDataPath);
    fs.readFile(messageDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Error reading messages' });
        }
        try {
            console.log('Data read:', data.substring(0, 50) + '...');
            res.json(JSON.parse(data));
        } catch (parseErr) {
            console.error('Error parsing messages.json:', parseErr);
            res.status(500).json({ message: 'Error parsing data' });
        }
    });
});

app.post('/api/messages', (req, res) => {
    const newMsg = req.body;
    fs.readFile(messageDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading messages' });
        const messages = JSON.parse(data);
        newMsg.id = Date.now();
        newMsg.date = new Date().toISOString().split('T')[0];
        messages.push(newMsg);
        fs.writeFile(messageDataPath, JSON.stringify(messages, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error sending message' });
            res.json({ message: 'Message sent' });
        });
    });
});

app.delete('/api/messages/:id', (req, res) => {
    const id = parseInt(req.params.id);
    fs.readFile(messageDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading messages' });
        let messages = JSON.parse(data);
        messages = messages.filter(m => m.id !== id);
        fs.writeFile(messageDataPath, JSON.stringify(messages, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error deleting message' });
            res.json({ message: 'Message deleted' });
        });
    });
});

// --- Orders API ---
app.get('/api/orders', (req, res) => {
    fs.readFile(orderDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading orders' });
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            console.error('Error parsing orders.json:', e);
            res.json([]); // Return empty array on error
        }
    });
});

app.post('/api/orders', upload.single('sampleFile'), checkUserAuth, (req, res) => {
    const newOrder = req.body;
    // Attach user ID if available from auth
    newOrder.userId = req.user.id;
    newOrder.userName = req.user.name;

    fs.readFile(orderDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading orders' });
        const orders = JSON.parse(data);

        newOrder.id = Date.now();
        newOrder.date = new Date().toISOString().split('T')[0];
        newOrder.status = 'Pending';
        if (req.file) {
            newOrder.file = '/uploads/' + req.file.filename;
        } else {
            newOrder.file = null;
        }

        orders.push(newOrder);

        fs.writeFile(orderDataPath, JSON.stringify(orders, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error placing order' });
            res.json({ message: 'Order placed successfully' });
        });
    });
});

app.post('/api/orders/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    fs.readFile(orderDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading orders' });
        let orders = JSON.parse(data);
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = status;
            fs.writeFile(orderDataPath, JSON.stringify(orders, null, 2), (err) => {
                if (err) return res.status(500).json({ message: 'Error updating status' });
                res.json({ message: 'Status updated' });
            });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    });
});

app.delete('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    fs.readFile(orderDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading orders' });
        let orders = JSON.parse(data);
        orders = orders.filter(o => o.id !== id);
        fs.writeFile(orderDataPath, JSON.stringify(orders, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Error deleting order' });
            res.json({ message: 'Order deleted' });
        });
    });
});

// --- Settings API ---
const settingsDataPath = path.join(__dirname, 'data', 'settings.json');

app.get('/api/settings', (req, res) => {
    fs.readFile(settingsDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading settings' });
        const settings = JSON.parse(data);

        // Check Admin Auth for full access
        const token = req.cookies['auth_token'];
        if (token && sessions[token] && sessions[token].role === 'admin') {
            res.json(settings);
        } else {
            // Public view: Remove admin credentials (sensitive data)
            // This ensures index.html can still load theme/contact info
            if (settings.admin) delete settings.admin;
            res.json(settings);
        }
    });
});

app.post('/api/settings', checkAdminAuth, (req, res) => {
    const newSettings = req.body;
    fs.writeFile(settingsDataPath, JSON.stringify(newSettings, null, 2), (err) => {
        if (err) return res.status(500).json({ message: 'Error saving settings' });
        res.json({ message: 'Settings updated' });
    });
});

// --- Auth Recovery API ---
app.get('/api/auth/recovery', (req, res) => {
    fs.readFile(settingsDataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: 'Error' });
        const settings = JSON.parse(data);
        const info = (settings.admin && settings.admin.recoveryInfo)
            ? settings.admin.recoveryInfo
            : 'Please contact the system administrator for password recovery.';
        res.json({ info });
    });
});

// API: Delete Post
app.delete('/api/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id);

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading data' });
        }

        let posts = JSON.parse(data);
        const filteredPosts = posts.filter(post => post.id !== postId);

        fs.writeFile(dataPath, JSON.stringify(filteredPosts, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving data' });
            }
            res.json({ message: 'Post deleted successfully' });
        });
    });
});

// Main Route - Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Auth & Session Logic (Simple Custom Implementation) ---
const sessions = {}; // Token -> { role: 'admin'|'user', userId: ... }

function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware to parse cookies
app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            req.cookies[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    next();
});

// Middleware to check Admin Auth
function checkAdminAuth(req, res, next) {
    const token = req.cookies['auth_token'];
    if (token && sessions[token] && sessions[token].role === 'admin') {
        next();
    } else {
        if (req.path.startsWith('/api/')) {
            res.status(401).json({ message: 'Unauthorized' });
        } else {
            res.redirect('/admin/login');
        }
    }
}

// Middleware to check User Auth
function checkUserAuth(req, res, next) {
    const token = req.cookies['auth_token'];
    if (token && sessions[token] && sessions[token].role === 'user') {
        req.user = sessions[token];
        next();
    } else {
        res.status(401).json({ message: 'Login required' });
    }
}

// --- Auth APIs ---

app.post('/api/auth/login', (req, res) => {
    const { type, username, password, email } = req.body; // type: 'admin' or 'user'

    if (type === 'admin') {
        // Check Admin Credentials
        fs.readFile(settingsDataPath, 'utf8', (err, data) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            const settings = JSON.parse(data);
            const admin = settings.admin || { username: 'admin', password: 'password123' }; // Default fallback

            if (username === admin.username && password === admin.password) {
                const token = generateToken();
                sessions[token] = { role: 'admin', username: username };
                res.cookie('auth_token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 day
                res.json({ message: 'Login successful', redirect: '/admin/dashboard' });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        });
    } else {
        // Check User Credentials
        fs.readFile(userDataPath, 'utf8', (err, data) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            const users = JSON.parse(data);
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                const token = generateToken();
                sessions[token] = { role: 'user', id: user.id, name: user.name, email: user.email };
                res.cookie('auth_token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
                res.json({ message: 'Login successful', user: user });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const token = req.cookies['auth_token'];
    if (token) delete sessions[token];
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out' });
});

app.get('/api/auth/check', (req, res) => {
    const token = req.cookies['auth_token'];
    if (token && sessions[token]) {
        res.json({ loggedIn: true, user: sessions[token] });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- Admin Routes Protection ---

// Explicitly serve login page without auth check
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_login.html'));
});

// Protect all other /admin routes
app.use('/admin', checkAdminAuth);

// Admin Pages (Protected by middleware above)
app.get('/admin', (req, res) => res.redirect('/admin/dashboard')); // Redirect root /admin
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'admin_dashboard.html')));
app.get('/admin/services', (req, res) => res.sendFile(path.join(__dirname, 'admin_services.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(__dirname, 'admin_users.html')));
app.get('/admin/messages', (req, res) => res.sendFile(path.join(__dirname, 'admin_messages.html')));
app.get('/admin/orders', (req, res) => res.sendFile(path.join(__dirname, 'admin_orders.html')));
app.get('/admin/settings', (req, res) => res.sendFile(path.join(__dirname, 'admin_settings.html')));


// 404 Handler
app.use((req, res) => {
    res.status(404).send('<h1>404 - Page Not Found</h1><a href="/">Go Home</a>');
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Admin Login at http://localhost:${port}/admin`);
});
