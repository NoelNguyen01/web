const fs = require('fs');

const b64Html = fs.readFileSync('public/index.html').toString('base64');
const b64Css = fs.readFileSync('public/css/style.css').toString('base64');
const b64Js = fs.readFileSync('public/js/app.js').toString('base64');

const template = `const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e9
});

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Embedded frontend fallback for Render/Cloud (Works even if public folder is missing)
const B64_HTML = "${b64Html}";
const B64_CSS = "${b64Css}";
const B64_JS = "${b64Js}";

const FALLBACK_HTML = Buffer.from(B64_HTML, 'base64').toString('utf8');
const FALLBACK_CSS = Buffer.from(B64_CSS, 'base64').toString('utf8');
const FALLBACK_JS = Buffer.from(B64_JS, 'base64').toString('utf8');

let config = {
  roomPasscode: '3667',
  adminPasscode: '2412',
  geminiApiKey: process.env.GEMINI_API_KEY || 'AQ.Ab8RN6J1OFfBd3oqIYvf3MpvI1TVvVpEmhJStPSGi39SokBIkA'
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      config = { ...config, ...JSON.parse(raw) };
    }
  } catch (err) {}
}
loadConfig();

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {}
}

let messages = [];
try {
  if (fs.existsSync(MESSAGES_FILE)) {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
    messages = JSON.parse(raw);
    if (!Array.isArray(messages)) messages = [];
  }
} catch (err) {
  messages = [];
}

function saveMessages() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages.slice(-200), null, 2), 'utf8');
  } catch (err) {}
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }
});

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Guaranteed web routes (Self-contained)
app.get('/', (req, res) => {
  const p = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(p)) return res.sendFile(p);
  const p2 = path.join(__dirname, 'index.html');
  if (fs.existsSync(p2)) return res.sendFile(p2);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(FALLBACK_HTML);
});

app.get(['/style.css', '/css/style.css'], (req, res) => {
  const p = path.join(__dirname, 'public', 'css', 'style.css');
  if (fs.existsSync(p)) return res.sendFile(p);
  const p2 = path.join(__dirname, 'style.css');
  if (fs.existsSync(p2)) return res.sendFile(p2);
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.send(FALLBACK_CSS);
});

app.get(['/app.js', '/js/app.js'], (req, res) => {
  const p = path.join(__dirname, 'public', 'js', 'app.js');
  if (fs.existsSync(p)) return res.sendFile(p);
  const p2 = path.join(__dirname, 'app.js');
  if (fs.existsSync(p2)) return res.sendFile(p2);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send(FALLBACK_JS);
});

app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Tệp quá lớn! Giới hạn dung lượng là 2GB.' });
      }
      return res.status(400).json({ error: 'Lỗi tải tệp: ' + err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Lỗi máy chủ khi tải tệp: ' + err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy tệp tải lên' });
    }

    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const fileData = {
      originalName: originalName,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      url: '/uploads/' + req.file.filename
    };

    res.json({ success: true, file: fileData });
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    hasGeminiKey: !!config.geminiApiKey,
    roomName: 'Khu tự trị Noel Nguyễn'
  });
});

async function callGemini(promptText) {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '⚠️ Bot AI chưa được cấu hình GEMINI_API_KEY! Nhấn nút ⚙️ Bot AI để nhập key.';
  }

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=' + apiKey;
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: 'Bạn là "Noel Bot AI" 🤖 - trợ lý ảo vui tính, thông minh của nhóm chat "Khu tự trị Noel Nguyễn". Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt.\\n\\nCâu hỏi: ' + promptText
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return '❌ Lỗi kết nối Gemini API (' + res.status + '): ' + (errJson?.error?.message || 'Không thể tạo phản hồi');
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply ? reply.trim() : '🤔 Bot không nhận được phản hồi từ AI.';
  } catch (err) {
    return '❌ Không thể kết nối tới Google Gemini. Vui lòng thử lại sau.';
  }
}

const onlineUsers = new Map();
const adminTokens = new Set();

io.on('connection', (socket) => {
  let currentUser = null;

  socket.on('join_room', ({ username, passcode }) => {
    if (!username || typeof username !== 'string' || !username.trim()) {
      return socket.emit('join_error', 'Vui lòng nhập tên người dùng hợp lệ.');
    }

    if (passcode !== config.roomPasscode) {
      return socket.emit('join_error', 'Mật khẩu phòng không chính xác!');
    }

    currentUser = {
      username: username.trim().slice(0, 30),
      isAdmin: false,
      socketId: socket.id,
      joinedAt: Date.now()
    };

    onlineUsers.set(socket.id, currentUser);
    socket.join('noel_autonomous_room');

    socket.emit('join_success', {
      user: currentUser,
      roomName: 'Khu tự trị Noel Nguyễn',
      history: messages.slice(-150),
      onlineUsers: Array.from(onlineUsers.values()),
      hasGeminiKey: !!config.geminiApiKey
    });

    io.to('noel_autonomous_room').emit('user_joined', {
      user: currentUser,
      onlineUsers: Array.from(onlineUsers.values())
    });
  });

  socket.on('verify_admin', ({ passcode }) => {
    if (passcode === config.adminPasscode) {
      const adminToken = crypto.randomBytes(16).toString('hex');
      adminTokens.add(adminToken);

      if (currentUser) {
        currentUser.isAdmin = true;
        onlineUsers.set(socket.id, currentUser);
      }

      socket.emit('admin_success', { token: adminToken });
      io.to('noel_autonomous_room').emit('user_role_changed', {
        socketId: socket.id,
        username: currentUser ? currentUser.username : 'Unknown',
        isAdmin: true,
        onlineUsers: Array.from(onlineUsers.values())
      });
    } else {
      socket.emit('admin_error', 'Mật khẩu quản trị viên không chính xác!');
    }
  });

  socket.on('resume_admin', ({ adminToken }) => {
    if (adminToken && adminTokens.has(adminToken)) {
      if (currentUser) {
        currentUser.isAdmin = true;
        onlineUsers.set(socket.id, currentUser);
      }
      socket.emit('admin_success', { token: adminToken });
      io.to('noel_autonomous_room').emit('user_role_changed', {
        socketId: socket.id,
        username: currentUser ? currentUser.username : 'Unknown',
        isAdmin: true,
        onlineUsers: Array.from(onlineUsers.values())
      });
    }
  });

  socket.on('update_gemini_key', ({ apiKey }) => {
    if (!apiKey || typeof apiKey !== 'string') return;
    config.geminiApiKey = apiKey.trim();
    saveConfig();
    socket.emit('gemini_key_updated', { success: true });
    io.to('noel_autonomous_room').emit('bot_status_changed', { hasGeminiKey: true });
  });

  socket.on('send_message', async ({ text, file, adminToken }) => {
    if (!currentUser) return;

    const isAuthorizedAdmin = adminToken && adminTokens.has(adminToken);
    const hasAdminRole = currentUser.isAdmin || isAuthorizedAdmin;
    const cleanText = (text || '').trim();

    if (!cleanText && !file) return;

    const messageObj = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      username: currentUser.username,
      isAdmin: hasAdminRole,
      isBot: false,
      text: cleanText,
      file: file || null,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };

    messages.push(messageObj);
    if (messages.length > 250) messages.shift();
    saveMessages();

    io.to('noel_autonomous_room').emit('new_message', messageObj);

    const botTriggers = ['@bot', '@ai', '@gemini', '/ai', '/ask', 'noel bot'];
    const lowerText = cleanText.toLowerCase();
    const isBotRequested = botTriggers.some(trigger => lowerText.includes(trigger));

    if (isBotRequested) {
      let botPrompt = cleanText;
      botTriggers.forEach(t => {
        const regex = new RegExp(t, 'gi');
        botPrompt = botPrompt.replace(regex, '');
      });
      botPrompt = botPrompt.trim() || 'Chào bạn Noel Bot!';

      io.to('noel_autonomous_room').emit('bot_typing', { isTyping: true });

      try {
        const aiAnswer = await callGemini(botPrompt);
        const botMessage = {
          id: 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          username: 'Noel Bot AI',
          isAdmin: false,
          isBot: true,
          text: aiAnswer,
          file: null,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now()
        };

        messages.push(botMessage);
        if (messages.length > 250) messages.shift();
        saveMessages();

        io.to('noel_autonomous_room').emit('bot_typing', { isTyping: false });
        io.to('noel_autonomous_room').emit('new_message', botMessage);
      } catch (e) {
        io.to('noel_autonomous_room').emit('bot_typing', { isTyping: false });
      }
    }
  });

  socket.on('delete_message', ({ messageId, adminToken }) => {
    if (!adminTokens.has(adminToken)) {
      return socket.emit('action_error', 'Bạn không có quyền quản trị viên!');
    }
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages.splice(index, 1);
      saveMessages();
      io.to('noel_autonomous_room').emit('message_deleted', { messageId });
    }
  });

  socket.on('clear_chat', ({ adminToken }) => {
    if (!adminTokens.has(adminToken)) {
      return socket.emit('action_error', 'Bạn không có quyền quản trị viên!');
    }
    messages.length = 0;
    saveMessages();
    io.to('noel_autonomous_room').emit('chat_cleared', {
      by: currentUser ? currentUser.username : 'Admin'
    });
  });

  socket.on('disconnect', () => {
    if (currentUser) {
      onlineUsers.delete(socket.id);
      io.to('noel_autonomous_room').emit('user_left', {
        user: currentUser,
        onlineUsers: Array.from(onlineUsers.values())
      });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server is running on port ' + PORT);
});
`;

fs.writeFileSync('server.js', template, 'utf8');
console.log('Generated standalone server.js successfully!');
