export default function TopUsers({ data }) {
    if (!data || data.length === 0) {
        return <div className="activity-empty">No user data available</div>;
    }

    const medals = ['🥇', '🥈', '🥉'];

    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    };

    const maxClicks = data[0]?.click_count || 1;

    return (
        <div className="top-users-list">
            {data.map((user, i) => (
                <div key={i} className="top-user-row">
                    <div className="top-user-rank">
                        {i < 3 ? <span className="medal">{medals[i]}</span> : <span className="rank-num">#{i + 1}</span>}
                    </div>
                    <div className="top-user-avatar">{user.username[0].toUpperCase()}</div>
                    <div className="top-user-info">
                        <span className="top-user-name">{user.username}</span>
                        <span className="top-user-meta">{user.gender} · {user.age}y · {formatTime(user.last_active)}</span>
                    </div>
                    <div className="top-user-stats">
                        <span className="top-user-clicks">{user.click_count}</span>
                        <div className="top-user-bar-bg">
                            <div className="top-user-bar-fill" style={{ width: `${(user.click_count / maxClicks) * 100}%` }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
