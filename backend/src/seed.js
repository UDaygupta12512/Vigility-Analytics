const bcrypt = require('bcryptjs');
const db = require('./database');

async function seed() {
    console.log('Starting seed...');

    db.exec('DELETE FROM time_spent');
    db.exec('DELETE FROM feature_clicks');
    db.exec('DELETE FROM users');
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'feature_clicks', 'time_spent')");

    const users = [
        { username: 'alice', password: 'pass123', age: 25, gender: 'Female' },
        { username: 'bob', password: 'pass123', age: 35, gender: 'Male' },
        { username: 'charlie', password: 'pass123', age: 16, gender: 'Male' },
        { username: 'diana', password: 'pass123', age: 42, gender: 'Female' },
        { username: 'emma', password: 'pass123', age: 29, gender: 'Female' },
        { username: 'frank', password: 'pass123', age: 55, gender: 'Male' },
        { username: 'grace', password: 'pass123', age: 17, gender: 'Other' },
        { username: 'henry', password: 'pass123', age: 38, gender: 'Male' },
        { username: 'irene', password: 'pass123', age: 22, gender: 'Female' },
        { username: 'jack', password: 'pass123', age: 45, gender: 'Male' },
        { username: 'demo', password: 'demo', age: 28, gender: 'Male' },
    ];

    const insertUser = db.prepare(
        'INSERT INTO users (username, password, age, gender) VALUES (?, ?, ?, ?)'
    );

    const createdUsers = [];
    for (const user of users) {
        const hashed = await bcrypt.hash(user.password, 10);
        const result = insertUser.run(user.username, hashed, user.age, user.gender);
        createdUsers.push({ ...user, id: result.lastInsertRowid });
    }

    console.log(`Created ${createdUsers.length} users`);

    const featureNames = [
        'date_filter', 'age_filter', 'gender_filter',
        'bar_chart_click', 'bar_chart_zoom', 'line_chart_hover',
        'date_picker', 'filter_apply', 'dashboard_view',
        'export_csv', 'toggle_auto_refresh', 'login', 'register',
    ];

    const insertClick = db.prepare(
        'INSERT INTO feature_clicks (user_id, feature_name, timestamp) VALUES (?, ?, ?)'
    );

    const now = new Date();
    let totalClicks = 0;

    const insertClicks = db.transaction(() => {
        for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            const clicksPerDay = Math.floor(Math.random() * 7) + 4;

            for (let i = 0; i < clicksPerDay; i++) {
                const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                const feature = featureNames[Math.floor(Math.random() * featureNames.length)];
                const clickDate = new Date(date);
                clickDate.setHours(Math.floor(Math.random() * 24));
                clickDate.setMinutes(Math.floor(Math.random() * 60));
                clickDate.setSeconds(Math.floor(Math.random() * 60));

                const ts = clickDate.toISOString().replace('T', ' ').substring(0, 19);
                insertClick.run(user.id, feature, ts);
                totalClicks++;
            }
        }
    });
    insertClicks();

    console.log(`Created ${totalClicks} click events`);

    // seed time tracking data
    const insertTime = db.prepare(
        'INSERT INTO time_spent (user_id, feature_name, duration_seconds, timestamp) VALUES (?, ?, ?, ?)'
    );

    const timeFeatures = [
        'dashboard_view_time', 'date_filter', 'bar_chart_click',
        'filter_apply', 'export_csv', 'line_chart_hover',
        'age_filter', 'gender_filter',
    ];

    let totalTimeEntries = 0;

    const insertTimeEntries = db.transaction(() => {
        for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            const entriesPerDay = Math.floor(Math.random() * 4) + 2;

            for (let i = 0; i < entriesPerDay; i++) {
                const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                const feature = timeFeatures[Math.floor(Math.random() * timeFeatures.length)];
                const duration = Math.floor(Math.random() * 300) + 5;
                const entryDate = new Date(date);
                entryDate.setHours(Math.floor(Math.random() * 24));
                entryDate.setMinutes(Math.floor(Math.random() * 60));

                const ts = entryDate.toISOString().replace('T', ' ').substring(0, 19);
                insertTime.run(user.id, feature, duration, ts);
                totalTimeEntries++;
            }
        }
    });
    insertTimeEntries();

    console.log(`Created ${totalTimeEntries} time entries`);

    // print summary
    const featureSummary = db.prepare(
        'SELECT feature_name, COUNT(*) as count FROM feature_clicks GROUP BY feature_name ORDER BY count DESC'
    ).all();

    console.log('\nFeature breakdown:');
    featureSummary.forEach(({ feature_name, count }) => {
        console.log(`  ${feature_name}: ${count}`);
    });

    console.log('\nDone. Login with demo/demo or any user with pass123');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
