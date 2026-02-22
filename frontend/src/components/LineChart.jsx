import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function LineChart({ data, featureName }) {
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const values = data.map(d => d.click_count);

    const chartData = {
        labels,
        datasets: [{
            label: featureName ? `Clicks for "${featureName}"` : 'Total Clicks',
            data: values,
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0.01)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
            pointHoverBorderWidth: 3,
            borderWidth: 3,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true, position: 'top', align: 'end',
                labels: { color: '#94a3b8', font: { size: 12, weight: '500' }, usePointStyle: true, pointStyle: 'circle', padding: 20 },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e2e8f0', bodyColor: '#f8fafc',
                padding: 12, cornerRadius: 8,
                titleFont: { size: 13, weight: '600' }, bodyFont: { size: 14 },
                displayColors: false,
                callbacks: { label: (item) => `${item.raw} clicks` },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 11, weight: '500' }, maxTicksLimit: 12 },
                border: { display: false },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
                border: { display: false },
            },
        },
        animation: { duration: 1000, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
    };

    if (data.length === 0) {
        return (
            <div className="chart-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <p>No time trend data for the selected filters</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '320px' }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
