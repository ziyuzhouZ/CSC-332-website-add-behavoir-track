const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const db = new sqlite3.Database(path.resolve(process.cwd(), 'data', 'users.db'));

// 记录页面访问
router.post('/visit', (req, res) => {
    const { userId, pageUrl, duration, isBounce } = req.body;
    console.log('收到页面访问记录:', { userId, pageUrl, duration, isBounce });

    // 记录访问
    db.run(`
        INSERT INTO user_visits (user_id, page_url, duration, is_bounce)
        VALUES (?, ?, ?, ?)
    `, [userId, pageUrl, duration, isBounce ? 1 : 0], function(err) {
        if (err) {
            console.error('记录页面访问错误:', err);
            res.status(500).json({ error: '记录页面访问失败' });
            return;
        }

        // 更新页面指标
        db.run(`
            INSERT INTO page_metrics (page_url, total_visits, total_duration, bounce_count)
            VALUES (?, 1, ?, ?)
            ON CONFLICT(page_url) DO UPDATE SET
                total_visits = total_visits + 1,
                total_duration = total_duration + ?,
                bounce_count = bounce_count + ?
        `, [pageUrl, duration, isBounce ? 1 : 0, duration, isBounce ? 1 : 0], (err) => {
            if (err) {
                console.error('更新页面指标错误:', err);
                res.status(500).json({ error: '更新页面指标失败' });
                return;
            }

            console.log('页面访问记录成功');
            res.json({ success: true });
        });
    });
});

// 记录点击事件
router.post('/click', (req, res) => {
    const { userId, pageUrl, buttonType } = req.body;
    console.log('收到点击事件记录:', { userId, pageUrl, buttonType });

    db.run(`
        INSERT INTO user_clicks (user_id, page_url, button_type)
        VALUES (?, ?, ?)
    `, [userId, pageUrl, buttonType], function(err) {
        if (err) {
            console.error('记录点击事件错误:', err);
            res.status(500).json({ error: '记录点击事件失败' });
            return;
        }

        console.log('点击事件记录成功');
        res.json({ success: true });
    });
});

// 页面指标路由
router.get('/page-metrics', (req, res) => {
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

// 用户指标路由
router.get('/user-metrics/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log('收到用户指标请求，用户ID:', userId);
    
    // 获取用户点击数据
    db.all(`
        SELECT 
            COUNT(*) as totalClicks,
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
                COUNT(*) as visitCount,
                SUM(duration) as totalDuration
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

            // 计算转化率
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
                    totalDuration: visitRows[0]?.totalDuration || 0,
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

// 历史数据路由
router.get('/history/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log('收到历史数据请求，用户ID:', userId);
    
    db.all(`
        SELECT 
            v.page_url as page,
            v.duration,
            v.visit_time as timestamp,
            (
                SELECT COUNT(*)
                FROM user_clicks c
                WHERE c.user_id = v.user_id
                AND c.page_url = v.page_url
                AND c.click_time BETWEEN v.visit_time AND datetime(v.visit_time, '+' || v.duration || ' seconds')
            ) as clicks
        FROM user_visits v
        WHERE v.user_id = ?
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

module.exports = router; 