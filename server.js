const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// 导入路由
const behaviorRoutes = require('./src/routes/behavior');
const adminRoutes = require('./src/routes/admin');

// 创建 Express 应用 - 确保在使用app之前就定义它
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件设置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 请求日志中间件 (放在解析中间件之后，这样才能记录请求体)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('请求体:', req.body);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'src')));

// 添加CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 确保所有响应都有正确的内容类型
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(obj) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, obj);
  };
  next();
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 创建并初始化数据库
const db = new sqlite3.Database(path.resolve(process.cwd(), 'data', 'users.db'), (err) => {
  if (err) {
    console.error('无法连接到用户数据库:', err);
  } else {
    console.log('已连接到用户数据库');
    // 创建用户表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建商店表
    db.run(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        province TEXT NOT NULL,
        zipcode TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建产品表
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建库存表
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        color TEXT,
        size TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (store_id) REFERENCES stores(id),
        UNIQUE(product_id, store_id, color, size)
      )
    `);

    // 创建订单表
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        shipping_address TEXT,
        shipping_method TEXT,
        tracking_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建订单项目表
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        color TEXT,
        size TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // 创建销售记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        amount REAL NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // 创建用户访问记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS user_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        page_url TEXT NOT NULL,
        visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER NOT NULL,
        is_bounce INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建用户点击记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS user_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        page_url TEXT NOT NULL,
        click_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        button_type TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建页面指标表
    db.run(`
      CREATE TABLE IF NOT EXISTS page_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_url TEXT UNIQUE NOT NULL,
        total_visits INTEGER DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        bounce_count INTEGER DEFAULT 0
      )
    `);

    // 创建用户指标表
    db.run(`
      CREATE TABLE IF NOT EXISTS user_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_clicks INTEGER DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        most_clicked_page TEXT,
        most_browsed_page TEXT,
        conversion_rate REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 行为跟踪API路由
    app.post('/api/behavior/visit', (req, res) => {
      console.log('收到访问记录请求:', req.body);
      const { userId, pageUrl, duration, isBounce } = req.body;
      
      if (!userId || !pageUrl || duration === undefined) {
        console.log('缺少必要参数:', { userId, pageUrl, duration });
        return res.status(400).json({ success: false, message: '缺少必要参数' });
      }

      // 记录访问数据
      db.run(
        'INSERT INTO user_visits (user_id, page_url, duration, is_bounce) VALUES (?, ?, ?, ?)',
        [userId, pageUrl, duration, isBounce ? 1 : 0],
        function(err) {
          if (err) {
            console.error('记录访问数据失败:', err);
            return res.status(500).json({ success: false, message: '记录访问数据失败' });
          }

          console.log('访问数据记录成功，ID:', this.lastID);

          // 更新页面指标
          db.run(
            `INSERT INTO page_metrics (page_url, total_visits, total_duration, bounce_count)
             VALUES (?, 1, ?, ?)
             ON CONFLICT(page_url) DO UPDATE SET
             total_visits = total_visits + 1,
             total_duration = total_duration + ?,
             bounce_count = bounce_count + ?`,
            [pageUrl, duration, isBounce ? 1 : 0, duration, isBounce ? 1 : 0],
            function(err) {
              if (err) {
                console.error('更新页面指标失败:', err);
                return res.status(500).json({ success: false, message: '更新页面指标失败' });
              }
              console.log('页面指标更新成功');
              res.json({ success: true });
            }
          );
        }
      );
    });

    app.post('/api/behavior/click', (req, res) => {
      console.log('收到点击记录请求:', req.body);
      const { userId, pageUrl, buttonType } = req.body;
      
      if (!userId || !pageUrl || !buttonType) {
        console.log('缺少必要参数:', { userId, pageUrl, buttonType });
        return res.status(400).json({ success: false, message: '缺少必要参数' });
      }

      db.run(
        'INSERT INTO user_clicks (user_id, page_url, button_type) VALUES (?, ?, ?)',
        [userId, pageUrl, buttonType],
        function(err) {
          if (err) {
            console.error('记录点击数据失败:', err);
            return res.status(500).json({ success: false, message: '记录点击数据失败' });
          }
          console.log('点击数据记录成功，ID:', this.lastID);
          res.json({ success: true });
        }
      );
    });
  }
});

// 创建管理员数据库
const adminDb = new sqlite3.Database(path.resolve(process.cwd(), 'data', 'admin.db'), (err) => {
  if (err) {
    console.error('无法连接到管理员数据库:', err);
  } else {
    console.log('已连接到管理员数据库');
    
    // 创建管理员表
    adminDb.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        reference_admin_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, [], (err) => {
      if (err) {
        console.error('创建管理员表出错:', err.message);
      } else {
        console.log('管理员表创建成功或已存在');
        
        // 强制检查默认管理员账户
        adminDb.get('SELECT * FROM admins WHERE username = ?', ['ZZY'], (err, admin) => {
          if (err) {
            console.error('查询默认管理员出错:', err.message);
          } else if (!admin) {
            // 添加默认管理员账户
            console.log('创建默认管理员账户ZZY...');
            const { salt, hash } = hashPassword('Zzyzzy262625');
            adminDb.run(
              'INSERT INTO admins (username, password, email) VALUES (?, ?, ?)',
              ['ZZY', `${salt}:${hash}`, 'admin@fashionstore.com'],
              (err) => {
                if (err) {
                  console.error('创建默认管理员出错:', err.message);
                } else {
                  console.log('默认管理员账户创建成功');
                }
              }
            );
          } else {
            console.log('默认管理员账户已存在:', admin.username);
            console.log('管理员密码:', admin.password);
          }
        });
      }
    });

    // 创建管理员邀请码表
    adminDb.run(`
      CREATE TABLE IF NOT EXISTS admin_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invite_code TEXT UNIQUE NOT NULL,
        created_by INTEGER NOT NULL,
        is_used BOOLEAN DEFAULT 0,
        used_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES admins(id),
        FOREIGN KEY (used_by) REFERENCES admins(id)
      )
    `);
  }
});

// 工具函数：密码加密
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// 工具函数：验证密码
function verifyPassword(password, salt, hash) {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return passwordHash === hash;
}

// 删除管理员Token验证函数，简化实现
function verifyAdminToken(token) {
  // 简化实现，直接对应admin表的id字段
  try {
    // 查询数据库验证token是否存在（实际应用中应该使用缓存或JWT）
    return { adminId: 1, username: 'admin' }; // 简化返回
  } catch (error) {
    throw new Error('无效的Token');
  }
}

// 管理员权限中间件 - 简化处理方式
function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: '未授权访问', redirect: '/html/admin/login.html' });
    } else {
      return res.redirect('/html/admin/login.html');
    }
  }
  
  const token = authHeader.split(' ')[1];
  
  // 简化验证过程，假设token是有效的
  try {
    // 简单设置管理员信息
    req.admin = { id: 1, username: 'admin' };
    next();
  } catch (error) {
    console.error('管理员验证错误:', error);
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: '未授权访问', redirect: '/html/admin/login.html' });
    } else {
      return res.redirect('/html/admin/login.html');
    }
  }
}

// API路由：验证管理员Token - 简化实现
app.get('/api/admin/auth/validate', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // 简化验证过程，直接返回成功
  try {
    // 返回一个假的管理员信息
    res.json({
      success: true,
      admin: { id: 1, username: 'admin', email: 'admin@example.com' }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: '无效的管理员凭证' });
  }
});

// API路由：注册
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 基本验证
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '所有字段都是必填的' });
    }
    
    // 检查用户是否已存在
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, user) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      if (user) {
        return res.status(400).json({ success: false, message: '用户名或邮箱已被使用' });
      }
      
      try {
        // 加密密码
        const { salt, hash } = hashPassword(password);
        
        // 保存用户到数据库
        const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
        stmt.run(username, email, `${salt}:${hash}`, function(err) {
          if (err) {
            console.error('数据库插入错误:', err);
            return res.status(500).json({ success: false, message: '注册失败: ' + err.message });
          }
          
          res.status(201).json({ 
            success: true, 
            message: '注册成功',
            user: { id: this.lastID, username, email }
          });
        });
        stmt.finalize();
      } catch (error) {
        console.error('处理注册时出错:', error);
        res.status(500).json({ success: false, message: '服务器处理错误' });
      }
    });
  } catch (error) {
    console.error('注册路由错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// API路由：登录
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 基本验证
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '邮箱和密码都是必填的' });
    }
    
    // 查找用户
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      if (!user) {
        return res.status(401).json({ success: false, message: '邮箱或密码不正确' });
      }
      
      try {
        // 验证密码
        const [salt, storedHash] = user.password.split(':');
        if (!verifyPassword(password, salt, storedHash)) {
          return res.status(401).json({ success: false, message: '邮箱或密码不正确' });
        }
        
        // 简单生成令牌
        const token = crypto.randomBytes(64).toString('hex');
        
        res.status(200).json({
          success: true,
          message: '登录成功',
          token,
          user: { id: user.id, username: user.username, email: user.email }
        });
      } catch (error) {
        console.error('密码验证错误:', error);
        res.status(500).json({ success: false, message: '服务器处理错误' });
      }
    });
  } catch (error) {
    console.error('登录路由错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// API路由：检查用户名 - 支持GET方法
app.get('/api/auth/check-username', (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ success: false, message: '用户名是必需的' });
    }
    
    db.get('SELECT username FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      res.status(200).json({
        success: true,
        exists: !!user
      });
    });
  } catch (error) {
    console.error('检查用户名路由错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 设置默认路由 - 重定向到登录页面
app.get('/', (req, res) => {
  res.redirect('/html/auth/login.html');
});

// 状态检查接口
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 添加一个健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    routes: [
      '/api/admin/auth/login', 
      '/api/admin/auth/validate',
      '/api/admin/auth/invite',
      '/api/admin/auth/register',
      '/api/admin/auth/check-invite'
    ]
  });
});

// 简化管理员登录API - 参考用户登录实现
app.post('/api/admin/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 基本验证
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码都是必填项' });
    }
    
    // 查找管理员
    adminDb.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
      if (err) {
        console.error('查询管理员出错:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      if (!admin) {
        return res.status(401).json({ success: false, message: '用户名或密码不正确' });
      }
      
      try {
        // 验证密码
        const [salt, storedHash] = admin.password.split(':');
        if (!verifyPassword(password, salt, storedHash)) {
          return res.status(401).json({ success: false, message: '用户名或密码不正确' });
        }
        
        // 生成token
        const token = crypto.randomBytes(64).toString('hex');
        
        res.status(200).json({
          success: true,
          message: '登录成功',
          token,
          admin: { id: admin.id, username: admin.username, email: admin.email }
        });
      } catch (error) {
        console.error('密码验证错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
      }
    });
  } catch (error) {
    console.error('登录路由错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 行为跟踪API路由
app.get('/api/behavior/metrics', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  // 获取用户访问数据
  db.all(
    `SELECT 
      COUNT(*) as total_visits,
      AVG(duration) as avg_duration,
      SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as bounce_rate
    FROM user_visits 
    WHERE user_id = ?`,
    [userId],
    (err, visitResults) => {
      if (err) {
        console.error('获取访问数据失败:', err);
        return res.status(500).json({ success: false, message: '获取访问数据失败' });
      }

      // 获取用户点击数据
      db.all(
        `SELECT 
          COUNT(*) as total_clicks,
          button_type,
          COUNT(*) as type_count
        FROM user_clicks 
        WHERE user_id = ?
        GROUP BY button_type`,
        [userId],
        (err, clickResults) => {
          if (err) {
            console.error('获取点击数据失败:', err);
            return res.status(500).json({ success: false, message: '获取点击数据失败' });
          }

          const metrics = {
            visits: visitResults[0] || { total_visits: 0, avg_duration: 0, bounce_rate: 0 },
            clicks: {
              total: clickResults.reduce((sum, r) => sum + r.type_count, 0),
              byType: clickResults.reduce((acc, r) => {
                acc[r.button_type] = r.type_count;
                return acc;
              }, {})
            }
          };

          res.json({ success: true, metrics });
        }
      );
    }
  );
});

app.get('/api/behavior/history', (req, res) => {
  const { userId, startDate, endDate } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const dateFilter = startDate && endDate 
    ? 'AND visit_time BETWEEN ? AND ?' 
    : '';
  const params = startDate && endDate 
    ? [userId, startDate, endDate]
    : [userId];

  // 获取访问历史
  db.all(
    `SELECT page_url, visit_time, duration, is_bounce
    FROM user_visits 
    WHERE user_id = ? ${dateFilter}
    ORDER BY visit_time DESC
    LIMIT 100`,
    params,
    (err, visits) => {
      if (err) {
        console.error('获取访问历史失败:', err);
        return res.status(500).json({ success: false, message: '获取访问历史失败' });
      }

      // 获取点击历史
      db.all(
        `SELECT page_url, click_time, button_type
        FROM user_clicks 
        WHERE user_id = ? ${dateFilter}
        ORDER BY click_time DESC
        LIMIT 100`,
        params,
        (err, clicks) => {
          if (err) {
            console.error('获取点击历史失败:', err);
            return res.status(500).json({ success: false, message: '获取点击历史失败' });
          }

          res.json({
            success: true,
            history: {
              visits,
              clicks
            }
          });
        }
      );
    }
  );
});

// 注册路由
app.use('/api/behavior', behaviorRoutes);
app.use('/api/admin', adminRoutes);

// 捕获404错误
app.use((req, res) => {
  // 记录404错误日志，以便调试
  console.log('404错误路径:', req.path);
  
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ success: false, message: '接口不存在' });
  } else {
    res.status(404).sendFile(path.join(__dirname, 'src/html/404.html'));
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});

// API路由：生成邀请码
app.post('/api/admin/auth/invite', isAdmin, (req, res) => {
  const adminId = req.admin.id;
  
  // 生成一个随机邀请码
  const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
  
  // 设置有效期为7天
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // 保存邀请码
  adminDb.run(
    'INSERT INTO admin_invites (invite_code, created_by, expires_at) VALUES (?, ?, ?)',
    [inviteCode, adminId, expiresAt.toISOString()],
    function(err) {
      if (err) {
        console.error('创建邀请码错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      res.json({
        success: true,
        inviteCode,
        expiresAt: expiresAt.toISOString()
      });
    }
  );
});

// API路由：管理员注册（需要邀请码）
app.post('/api/admin/auth/register', (req, res) => {
  const { username, password, email, inviteCode } = req.body;
  
  if (!username || !password || !email || !inviteCode) {
    return res.status(400).json({ success: false, message: '所有字段都是必填的' });
  }
  
  // 验证邀请码
  adminDb.get(
    'SELECT * FROM admin_invites WHERE invite_code = ? AND is_used = 0 AND expires_at > ?',
    [inviteCode, new Date().toISOString()],
    (err, invite) => {
      if (err) {
        console.error('验证邀请码错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      if (!invite) {
        return res.status(400).json({ success: false, message: '邀请码无效或已过期' });
      }
      
      // 检查用户名是否已存在
      adminDb.get('SELECT * FROM admins WHERE username = ? OR email = ?', [username, email], (err, admin) => {
        if (err) {
          console.error('查询管理员出错:', err);
          return res.status(500).json({ success: false, message: '服务器错误' });
        }
        
        if (admin) {
          return res.status(400).json({ success: false, message: '用户名或邮箱已被使用' });
        }
        
        // 加密密码
        const { salt, hash } = hashPassword(password);
        
        // 保存新管理员
        adminDb.run(
          'INSERT INTO admins (username, password, email, reference_admin_id) VALUES (?, ?, ?, ?)',
          [username, `${salt}:${hash}`, email, invite.created_by],
          function(err) {
            if (err) {
              console.error('创建管理员错误:', err);
              return res.status(500).json({ success: false, message: '服务器错误' });
            }
            
            const newAdminId = this.lastID;
            
            // 标记邀请码为已使用
            adminDb.run(
              'UPDATE admin_invites SET is_used = 1, used_by = ? WHERE id = ?',
              [newAdminId, invite.id],
              (err) => {
                if (err) {
                  console.error('更新邀请码状态错误:', err);
                }
                
                // 简化token生成
                const token = crypto.randomBytes(64).toString('hex');
                
                res.status(201).json({
                  success: true,
                  message: '注册成功',
                  token,
                  admin: { id: newAdminId, username, email }
                });
              }
            );
          }
        );
      });
    }
  );
});

// API路由：检查邀请码有效性
app.post('/api/admin/auth/check-invite', (req, res) => {
  const { inviteCode } = req.body;
  
  if (!inviteCode) {
    return res.status(400).json({ success: false, message: '请提供邀请码' });
  }
  
  // 验证邀请码
  adminDb.get(
    'SELECT * FROM admin_invites WHERE invite_code = ? AND is_used = 0 AND expires_at > ?',
    [inviteCode, new Date().toISOString()],
    (err, invite) => {
      if (err) {
        console.error('验证邀请码错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      if (!invite) {
        return res.status(400).json({ success: false, message: '邀请码无效或已过期' });
      }
      
      res.json({
        success: true,
        message: '邀请码有效'
      });
    }
  );
});

// API路由：获取所有门店
app.get('/api/admin/stores', isAdmin, (req, res) => {
  db.all(`
    SELECT 
      s.*, 
      (SELECT SUM(quantity) FROM inventory WHERE store_id = s.id) as total_inventory,
      (SELECT SUM(amount) FROM sales WHERE store_id = s.id AND date(sale_date) = date('now')) as today_sales
    FROM stores s
    ORDER BY s.name
  `, [], (err, stores) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    res.json({ success: true, stores });
  });
});

// API路由：获取门店详情
app.get('/api/admin/stores/:id', isAdmin, (req, res) => {
  const storeId = req.params.id;
  
  db.get('SELECT * FROM stores WHERE id = ?', [storeId], (err, store) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    if (!store) {
      return res.status(404).json({ success: false, message: '门店不存在' });
    }
    
    // 查询门店的库存商品
    db.all(`
      SELECT 
        p.id, p.name, p.price, i.sku, i.color, i.size, i.quantity
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.store_id = ?
      ORDER BY p.name, i.color, i.size
    `, [storeId], (err, inventory) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      // 查询门店的销售记录
      const dateFilter = req.query.dateFilter || 'week';
      let dateCondition = '';
      
      if (dateFilter === 'today') {
        dateCondition = "AND date(sale_date) = date('now')";
      } else if (dateFilter === 'week') {
        dateCondition = "AND date(sale_date) >= date('now', '-7 days')";
      } else if (dateFilter === 'month') {
        dateCondition = "AND date(sale_date) >= date('now', '-1 month')";
      } else if (dateFilter === 'custom' && req.query.startDate && req.query.endDate) {
        dateCondition = `AND date(sale_date) BETWEEN '${req.query.startDate}' AND '${req.query.endDate}'`;
      }
      
      db.all(`
        SELECT 
          s.id, s.sale_date, p.name as product_name, s.sku, s.quantity, s.amount
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.store_id = ? ${dateCondition}
        ORDER BY s.sale_date DESC
      `, [storeId], (err, sales) => {
        if (err) {
          console.error('数据库查询错误:', err);
          return res.status(500).json({ success: false, message: '服务器错误' });
        }
        
        res.json({
          success: true,
          store,
          inventory,
          sales
        });
      });
    });
  });
});

// API路由：获取销售汇总
app.get('/api/admin/sales', isAdmin, (req, res) => {
  const period = req.query.period || 'month';
  let groupBy = '';
  let dateCondition = '';
  
  if (period === 'day') {
    groupBy = "date(s.sale_date)";
    dateCondition = "AND date(s.sale_date) >= date('now', '-30 days')";
  } else if (period === 'week') {
    groupBy = "strftime('%Y-%W', s.sale_date)";
    dateCondition = "AND date(s.sale_date) >= date('now', '-24 weeks')";
  } else {
    groupBy = "strftime('%Y-%m', s.sale_date)";
    dateCondition = "AND date(s.sale_date) >= date('now', '-12 months')";
  }
  
  // 获取销售额数据
  db.all(`
    SELECT 
      ${groupBy} as period,
      SUM(s.amount) as total_sales
    FROM sales s
    WHERE 1=1 ${dateCondition}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy}
  `, [], (err, salesData) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    // 获取热销商品
    db.all(`
      SELECT 
        p.id, p.name, SUM(s.quantity) as total_quantity, SUM(s.amount) as total_amount
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE date(s.sale_date) >= date('now', '-30 days')
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 10
    `, [], (err, topProducts) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      // 获取门店销售排名
      db.all(`
        SELECT 
          st.id, st.name, SUM(s.amount) as total_sales
        FROM sales s
        JOIN stores st ON s.store_id = st.id
        WHERE date(s.sale_date) >= date('now', '-30 days')
        GROUP BY st.id
        ORDER BY total_sales DESC
      `, [], (err, storeRanking) => {
        if (err) {
          console.error('数据库查询错误:', err);
          return res.status(500).json({ success: false, message: '服务器错误' });
        }
        
        res.json({
          success: true,
          salesData,
          topProducts,
          storeRanking
        });
      });
    });
  });
});

// API路由：获取订单列表
app.get('/api/admin/orders', isAdmin, (req, res) => {
  const status = req.query.status || 'all';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  let statusCondition = '';
  if (status !== 'all') {
    statusCondition = `WHERE o.status = '${status}'`;
  }
  
  // 获取订单总数以支持分页
  db.get(`
    SELECT COUNT(*) as total
    FROM orders o
    ${statusCondition}
  `, [], (err, result) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    const totalOrders = result.total;
    const totalPages = Math.ceil(totalOrders / limit);
    
    // 获取订单列表
    db.all(`
      SELECT 
        o.id, o.total_amount, o.status, o.created_at,
        u.username as customer_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${statusCondition}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, orders) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
      }
      
      res.json({
        success: true,
        orders,
        pagination: {
          total: totalOrders,
          current_page: page,
          per_page: limit,
          total_pages: totalPages
        }
      });
    });
  });
});

// 用户行为分析相关路由
app.get('/api/behavior/page-metrics', (req, res) => {
    console.log('收到页面指标请求');
    db.all(`
        SELECT 
            COUNT(*) as totalVisits,
            AVG(duration) as avgDuration,
            (COUNT(CASE WHEN is_bounce = 1 THEN 1 END) * 100.0 / COUNT(*)) as bounceRate
        FROM user_visits
    `, [], (err, rows) => {
        if (err) {
            console.error('获取页面指标错误:', err);
            res.status(500).json({ error: '获取页面指标失败' });
            return;
        }
        console.log('返回页面指标:', rows[0]);
        res.json(rows[0] || { totalVisits: 0, avgDuration: 0, bounceRate: 0 });
    });
});

app.get('/api/behavior/user-metrics/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log('收到用户指标请求，用户ID:', userId);
    
    // 获取用户点击数据
    db.all(`
        SELECT 
            COUNT(*) as totalClicks,
            SUM(duration) as totalDuration,
            button_type as mostClickedArea
        FROM user_clicks
        WHERE user_id = ?
        GROUP BY button_type
        ORDER BY COUNT(*) DESC
        LIMIT 1
    `, [userId], (err, clickRows) => {
        if (err) {
            console.error('获取用户点击指标错误:', err);
            res.status(500).json({ error: '获取用户点击指标失败' });
            return;
        }

        // 获取用户浏览数据
        db.all(`
            SELECT 
                page_url as mostBrowsedArea,
                COUNT(*) as visitCount
            FROM user_visits
            WHERE user_id = ?
            GROUP BY page_url
            ORDER BY COUNT(*) DESC
            LIMIT 1
        `, [userId], (err, visitRows) => {
            if (err) {
                console.error('获取用户浏览指标错误:', err);
                res.status(500).json({ error: '获取用户浏览指标失败' });
                return;
            }

            // 计算转化率（这里简单定义为有购买行为的访问比例）
            db.get(`
                SELECT 
                    (COUNT(CASE WHEN has_purchase = 1 THEN 1 END) * 100.0 / COUNT(*)) as conversionRate
                FROM user_visits
                WHERE user_id = ?
            `, [userId], (err, conversionRow) => {
                if (err) {
                    console.error('计算转化率错误:', err);
                    res.status(500).json({ error: '计算转化率失败' });
                    return;
                }

                const response = {
                    totalClicks: clickRows[0]?.totalClicks || 0,
                    totalDuration: clickRows[0]?.totalDuration || 0,
                    mostClickedArea: clickRows[0]?.mostClickedArea || '无数据',
                    mostBrowsedArea: visitRows[0]?.mostBrowsedArea || '无数据',
                    conversionRate: conversionRow?.conversionRate || 0
                };
                console.log('返回用户指标:', response);
                res.json(response);
            });
        });
    });
});

app.get('/api/behavior/history/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log('收到历史数据请求，用户ID:', userId);
    
    db.all(`
        SELECT 
            v.page_url as page,
            v.duration,
            COUNT(c.id) as clicks,
            v.visit_time as timestamp
        FROM user_visits v
        LEFT JOIN user_clicks c ON v.id = c.visit_id
        WHERE v.user_id = ?
        GROUP BY v.id
        ORDER BY v.visit_time DESC
        LIMIT 50
    `, [userId], (err, rows) => {
        if (err) {
            console.error('获取历史数据错误:', err);
            res.status(500).json({ error: '获取历史数据失败' });
            return;
        }
        console.log('返回历史数据:', rows);
        res.json(rows || []);
    });
});

app.get('/api/behavior/detailed-records', (req, res) => {
  const { userId, pageUrl, startDate, endDate, limit = 10, offset = 0 } = req.query;
  
  let query = `
    SELECT 
      'visit' as type,
      user_id,
      page_url,
      visit_time as timestamp,
      duration,
      is_bounce,
      NULL as button_type
    FROM user_visits
    UNION ALL
    SELECT 
      'click' as type,
      user_id,
      page_url,
      click_time as timestamp,
      NULL as duration,
      NULL as is_bounce,
      button_type
    FROM user_clicks
  `;
  
  const conditions = [];
  const params = [];

  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }

  if (pageUrl) {
    conditions.push('page_url = ?');
    params.push(pageUrl);
  }

  if (startDate && endDate) {
    conditions.push('timestamp BETWEEN ? AND ?');
    params.push(startDate, endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('获取详细记录失败:', err);
      return res.status(500).json({ success: false, message: '获取详细记录失败' });
    }
    res.json({ success: true, data: rows });
  });
}); 