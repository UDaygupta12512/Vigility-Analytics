export default function FeatureTimeList({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="chart-empty">
                <p>No time tracking data available</p>
            </div>
        );
    }

    const formatDuration = (seconds) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60);
        if (min < 60) return `${min}m ${sec}s`;
        const hrs = Math.floor(min / 60);
        return `${hrs}h ${min % 60}m`;
    };

    return (
        <div className="feature-time-list">
            <table className="time-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Avg. Time / Action</th>
                        <th>Total Time</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, i) => (
                        <tr key={i}>
                            <td><span className="feature-name-badge">{item.feature_name}</span></td>
                            <td>{formatDuration(item.avg_duration)}</td>
                            <td>{formatDuration(item.total_duration)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
