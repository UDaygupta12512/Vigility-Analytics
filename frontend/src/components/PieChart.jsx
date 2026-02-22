import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
    'rgba(99, 102, 241, 0.85)',
    'rgba(236, 72, 153, 0.85)',
    'rgba(34, 197, 94, 0.85)',
    'rgba(249, 115, 22, 0.85)',
    'rgba(14, 165, 233, 0.85)',
    'rgba(168, 85, 247, 0.85)',
];

const COLORS_HOVER = COLORS.map(c => c.replace('0.85)', '1)'));

export default function PieChart({ data, labelKey = 'label', valueKey = 'count' }) {
    if (!data || data.length === 0) {
        return (
            <div className="chart-empty" style={{ height: '250px' }}>
                <p>No data available</p>
            </div>
        );
    }

    const labels = data.map(d => d[labelKey]);
    const values = data.map(d => d[valueKey]);

    const chartData = {
        labels,
        datasets: [{
            data: values,
            backgroundColor: COLORS,
            hoverBackgroundColor: COLORS_HOVER,
            borderWidth: 2,
            borderColor: '#ffffff',
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { usePointStyle: true, padding: 20, font: { size: 12 }, color: '#64748b' }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e2e8f0', bodyColor: '#f8fafc',
                padding: 12, cornerRadius: 8,
                callbacks: { label: (item) => ` ${item.label}: ${item.raw} users` }
            },
            title: { display: false },
        },
        cutout: '65%',
    };

    return (
        <div style={{ width: '100%', height: '250px', position: 'relative' }}>
            <Doughnut data={chartData} options={options} />
        </div>
    );
}
