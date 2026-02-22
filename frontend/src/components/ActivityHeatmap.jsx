import { useMemo } from 'react';

export default function ActivityHeatmap({ data }) {
    const { weeks, maxCount, monthLabels } = useMemo(() => {
        const today = new Date();
        const map = {};
        (data || []).forEach(d => { map[d.date] = d.count; });

        const totalDays = 91;
        const days = [];
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            days.push({ date: key, count: map[key] || 0, day: d.getDay(), month: d.getMonth() });
        }

        let max = 0;
        days.forEach(d => { if (d.count > max) max = d.count; });

        // group into weekly columns
        const weeks = [];
        let currentWeek = [];
        // pad the first week with empty slots
        const firstDay = days[0].day;
        for (let i = 0; i < firstDay; i++) currentWeek.push(null);
        days.forEach(d => {
            currentWeek.push(d);
            if (d.day === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });
        if (currentWeek.length > 0) weeks.push(currentWeek);

        // month labels along the top
        const labels = [];
        let lastMonth = -1;
        days.forEach((d, i) => {
            if (d.month !== lastMonth && d.day <= 3) {
                const name = new Date(d.date).toLocaleDateString('en-US', { month: 'short' });
                labels.push({ name, index: Math.floor(i / 7) });
                lastMonth = d.month;
            }
        });

        return { weeks, maxCount: max, monthLabels: labels };
    }, [data]);

    const getColor = (count) => {
        if (count === 0) return 'var(--heatmap-empty, rgba(148, 163, 184, 0.08))';
        const ratio = maxCount > 0 ? count / maxCount : 0;
        if (ratio < 0.25) return 'rgba(99, 102, 241, 0.25)';
        if (ratio < 0.5) return 'rgba(99, 102, 241, 0.45)';
        if (ratio < 0.75) return 'rgba(99, 102, 241, 0.7)';
        return 'rgba(99, 102, 241, 1)';
    };

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    return (
        <div className="heatmap-container">
            <div className="heatmap-months">
                <div style={{ width: 28 }}></div>
                {monthLabels.map((m, i) => (
                    <span key={i} className="heatmap-month" style={{ gridColumn: m.index + 2 }}>{m.name}</span>
                ))}
            </div>
            <div className="heatmap-grid">
                <div className="heatmap-days">
                    {dayLabels.map((l, i) => <span key={i}>{l}</span>)}
                </div>
                <div className="heatmap-cells">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="heatmap-col">
                            {week.map((day, di) => (
                                day ? (
                                    <div
                                        key={di}
                                        className="heatmap-cell"
                                        style={{ backgroundColor: getColor(day.count) }}
                                        title={`${day.date}: ${day.count} events`}
                                    />
                                ) : (
                                    <div key={di} className="heatmap-cell heatmap-cell-empty" />
                                )
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="heatmap-legend">
                <span>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                    <div key={i} className="heatmap-cell" style={{ backgroundColor: getColor(r * (maxCount || 1)) }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
