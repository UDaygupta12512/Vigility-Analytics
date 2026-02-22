const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/track', authenticateToken, (req, res) => {
    try {
        const { feature_name } = req.body;
        const user_id = req.user.id;

        if (!feature_name || typeof feature_name !== 'string' || feature_name.trim().length === 0) {
            return res.status(400).json({ error: 'feature_name is required' });
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const result = db.prepare(
            'INSERT INTO feature_clicks (user_id, feature_name, timestamp) VALUES (?, ?, ?)'
        ).run(user_id, feature_name.trim(), now);

        res.status(201).json({
            message: 'Interaction tracked',
            click: {
                id: result.lastInsertRowid,
                user_id,
                feature_name: feature_name.trim(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Track error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/analytics', authenticateToken, (req, res) => {
    try {
        const { start_date, end_date, age_group, gender, feature_name } = req.query;

        let conditions = [];
        let params = [];

        if (start_date) {
            conditions.push('fc.timestamp >= ?');
            params.push(start_date);
        }

        if (end_date) {
            conditions.push('fc.timestamp <= ?');
            params.push(end_date + ' 23:59:59');
        }

        if (gender && gender !== 'All') {
            conditions.push('u.gender = ?');
            params.push(gender);
        }

        if (age_group && age_group !== 'All') {
            switch (age_group) {
                case '<18':
                    conditions.push('u.age < 18');
                    break;
                case '18-40':
                    conditions.push('u.age >= 18 AND u.age <= 40');
                    break;
                case '>40':
                    conditions.push('u.age > 40');
                    break;
            }
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // bar chart: total clicks per feature
        const barChartData = db.prepare(`
            SELECT fc.feature_name, COUNT(*) as total_clicks
            FROM feature_clicks fc
            JOIN users u ON fc.user_id = u.id
            ${whereClause}
            GROUP BY fc.feature_name
            ORDER BY total_clicks DESC
        `).all(...params);

        // line chart: clicks over time (optionally filtered to a single feature)
        let lineConditions = [...conditions];
        let lineParams = [...params];

        if (feature_name) {
            lineConditions.push('fc.feature_name = ?');
            lineParams.push(feature_name);
        }

        const lineWhereClause = lineConditions.length > 0 ? 'WHERE ' + lineConditions.join(' AND ') : '';

        const lineChartData = db.prepare(`
            SELECT DATE(fc.timestamp) as date, COUNT(*) as click_count
            FROM feature_clicks fc
            JOIN users u ON fc.user_id = u.id
            ${lineWhereClause}
            GROUP BY DATE(fc.timestamp)
            ORDER BY date ASC
        `).all(...lineParams);

        // demographics
        const genderData = db.prepare(`
            SELECT u.gender, COUNT(DISTINCT u.id) as count
            FROM feature_clicks fc
            JOIN users u ON fc.user_id = u.id
            ${whereClause}
            GROUP BY u.gender
        `).all(...params);

        const ageData = db.prepare(`
            SELECT 
                CASE 
                    WHEN u.age < 18 THEN '<18'
                    WHEN u.age BETWEEN 18 AND 40 THEN '18-40'
                    ELSE '>40'
                END as age_range,
                COUNT(DISTINCT u.id) as count
            FROM feature_clicks fc
            JOIN users u ON fc.user_id = u.id
            ${whereClause}
            GROUP BY age_range
        `).all(...params);

        // time spent per feature
        const timeWhereClause = whereClause.split('fc.').join('ts.');
        const timeSpentData = db.prepare(`
            SELECT feature_name, AVG(duration_seconds) as avg_duration, SUM(duration_seconds) as total_duration
            FROM time_spent ts
            JOIN users u ON ts.user_id = u.id
            ${timeWhereClause}
            GROUP BY feature_name
            ORDER BY total_duration DESC
        `).all(...params);

        // recent activity
        const recentActivity = db.prepare(`
            SELECT u.username, fc.feature_name, fc.timestamp
            FROM feature_clicks fc
            JOIN users u ON fc.user_id = u.id
            ${whereClause}
            ORDER BY fc.timestamp DESC
            LIMIT 5
        `).all(...params);

        const totalClicks = db.prepare(`
            SELECT COUNT(*) as total FROM feature_clicks fc JOIN users u ON fc.user_id = u.id ${whereClause}
        `).get(...params);

        const uniqueUsers = db.prepare(`
            SELECT COUNT(DISTINCT fc.user_id) as total FROM feature_clicks fc JOIN users u ON fc.user_id = u.id ${whereClause}
        `).get(...params);

        const uniqueFeatures = db.prepare(`
            SELECT COUNT(DISTINCT fc.feature_name) as total FROM feature_clicks fc JOIN users u ON fc.user_id = u.id ${whereClause}
        `).get(...params);

        // heatmap: daily click counts for last 90 days (unfiltered for full picture)
        const heatmapData = db.prepare(`
            SELECT DATE(fc.timestamp) as date, COUNT(*) as count
            FROM feature_clicks fc
            WHERE fc.timestamp >= DATE('now', '-90 days')
            GROUP BY DATE(fc.timestamp)
            ORDER BY date ASC
        `).all();

        // top users by click count
        const topUsers = db.prepare(`
            SELECT u.username, u.gender, u.age, COUNT(fc.id) as click_count,
                   MAX(fc.timestamp) as last_active
            FROM feature_clicks fc
            JOIN users u ON fc.user_id = u.id
            ${whereClause}
            GROUP BY u.id
            ORDER BY click_count DESC
            LIMIT 5
        `).all(...params);

        // avg session duration
        const avgSession = db.prepare(`
            SELECT ROUND(AVG(duration_seconds)) as avg_duration
            FROM time_spent ts
            JOIN users u ON ts.user_id = u.id
            ${timeWhereClause}
        `).get(...params);

        // trend: compare current period clicks vs previous equal-length period
        let trendPercent = null;
        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            const rangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            const prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - rangeDays - 1);
            const prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);

            const prevCount = db.prepare(`
                SELECT COUNT(*) as total FROM feature_clicks fc
                JOIN users u ON fc.user_id = u.id
                WHERE fc.timestamp >= ? AND fc.timestamp <= ?
            `).get(prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0] + ' 23:59:59');

            if (prevCount.total > 0) {
                trendPercent = Math.round(((totalClicks.total - prevCount.total) / prevCount.total) * 100);
            }
        }

        res.json({
            bar_chart: barChartData,
            line_chart: lineChartData,
            pie_chart_gender: genderData,
            pie_chart_age: ageData,
            time_spent: timeSpentData,
            recent_activity: recentActivity,
            heatmap: heatmapData,
            top_users: topUsers,
            summary: {
                total_clicks: totalClicks.total,
                unique_users: uniqueUsers.total,
                unique_features: uniqueFeatures.total,
                avg_session_time: avgSession?.avg_duration || 0,
                trend_percent: trendPercent,
            }
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/track-time', authenticateToken, (req, res) => {
    try {
        const { feature_name, duration } = req.body;
        const user_id = req.user.id;

        if (!feature_name || !duration) {
            return res.status(400).json({ error: 'feature_name and duration are required' });
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        db.prepare(
            'INSERT INTO time_spent (user_id, feature_name, duration_seconds, timestamp) VALUES (?, ?, ?, ?)'
        ).run(user_id, feature_name, duration, now);

        res.status(201).json({ message: 'Time tracked' });
    } catch (err) {
        console.error('Track time error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
