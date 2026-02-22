import { useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = [
    'rgba(99, 102, 241, 0.85)',
    'rgba(139, 92, 246, 0.85)',
    'rgba(236, 72, 153, 0.85)',
    'rgba(14, 165, 233, 0.85)',
    'rgba(34, 197, 94, 0.85)',
    'rgba(249, 115, 22, 0.85)',
    'rgba(168, 85, 247, 0.85)',
    'rgba(20, 184, 166, 0.85)',
    'rgba(245, 158, 11, 0.85)',
    'rgba(239, 68, 68, 0.85)',
];

const COLORS_HOVER = COLORS.map(c => c.replace('0.85)', '1)'));

export default function BarChart({ data, selectedFeature, onBarClick }) {
    const chartRef = useRef(null);

    const labels = data.map(d => d.feature_name);
    const values = data.map(d => d.total_clicks);

    const backgroundColors = data.map((d, i) => {
        if (selectedFeature && d.feature_name !== selectedFeature) return 'rgba(148, 163, 184, 0.3)';
        return COLORS[i % COLORS.length];
    });

    const hoverColors = data.map((d, i) => {
        if (selectedFeature && d.feature_name !== selectedFeature) return 'rgba(148, 163, 184, 0.5)';
        return COLORS_HOVER[i % COLORS_HOVER.length];
    });

    const chartData = {
        labels,
        datasets: [{
            label: 'Total Clicks',
            data: values,
            backgroundColor: backgroundColors,
            hoverBackgroundColor: hoverColors,
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
            if (elements.length > 0) {
                onBarClick(labels[elements[0].index]);
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#f8fafc',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 13, weight: '600' },
                bodyFont: { size: 14 },
                displayColors: false,
                callbacks: {
                    title: (items) => `Feature: ${items[0].label}`,
                    label: (item) => `${item.raw} total clicks`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 11, weight: '500' }, maxRotation: 45, minRotation: 0 },
                border: { display: false },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
                border: { display: false },
            },
        },
        animation: { duration: 800, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
    };

    if (data.length === 0) {
        return (
            <div className="chart-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <p>No data available for the selected filters</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '320px' }}>
            <Bar ref={chartRef} data={chartData} options={options} />
        </div>
    );
}
