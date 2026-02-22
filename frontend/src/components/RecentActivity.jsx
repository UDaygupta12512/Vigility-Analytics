export default function RecentActivity({ data }) {
    if (!data || data.length === 0) {
        return <div className="activity-empty">No recent activity</div>;
    }

    const formatTime = (isoString) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(new Date(isoString));
    };

    return (
        <div className="recent-activity-list">
            <table className="activity-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Action</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, i) => (
                        <tr key={i}>
                            <td>
                                <div className="user-cell">
                                    <div className="avatar-xs">{item.username[0].toUpperCase()}</div>
                                    <span className="username-text">{item.username}</span>
                                </div>
                            </td>
                            <td><span className="action-badge">{item.feature_name}</span></td>
                            <td className="time-cell">{formatTime(item.timestamp)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
