import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { getAnalytics, trackEvent, trackTime } from '../api';
import { useAuth } from '../AuthContext';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import RecentActivity from './RecentActivity';
import FeatureTimeList from './FeatureTimeList';
import ActivityHeatmap from './ActivityHeatmap';
import TopUsers from './TopUsers';

const COOKIE_KEY = 'analytics_filters';

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
}

function formatSeconds(s) {
    if (!s || s === 0) return '—';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${Math.round(s % 60)}s`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [filters, setFilters] = useState({
        start_date: '', end_date: '', age_group: 'All', gender: 'All',
    });
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [featureSearch, setFeatureSearch] = useState('');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [demographicTab, setDemographicTab] = useState('gender');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const initialLoadDone = useRef(false);
    const startTimeRef = useRef(Date.now());

    // restore filters from cookie
    useEffect(() => {
        try {
            const saved = Cookies.get(COOKIE_KEY);
            if (saved) setFilters(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch { /* ignore */ }
    }, []);

    // persist filters
    useEffect(() => {
        if (initialLoadDone.current) {
            Cookies.set(COOKIE_KEY, JSON.stringify(filters), { expires: 30 });
        }
    }, [filters]);

    // track time on dashboard
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.hidden) {
                const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
                if (dur > 0) trackTime('dashboard_view_time', dur);
                startTimeRef.current = Date.now();
            } else {
                startTimeRef.current = Date.now();
            }
        };
        const onUnload = () => {
            const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
            if (dur > 0) trackTime('dashboard_view_time', dur);
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('beforeunload', onUnload);
        return () => {
            onUnload();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('beforeunload', onUnload);
        };
    }, []);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAnalytics({
                ...filters,
                feature_name: selectedFeature || undefined,
            });
            setAnalyticsData(data);
        } catch (err) {
            toast.error('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
            initialLoadDone.current = true;
        }
    }, [filters, selectedFeature]);

    useEffect(() => {
        fetchAnalytics();
        trackEvent('dashboard_view');
    }, [fetchAnalytics]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        const trackMap = { start_date: 'date_filter', end_date: 'date_filter', age_group: 'age_filter', gender: 'gender_filter' };
        trackEvent(trackMap[key] || 'filter_apply');
    };

    const handleBarClick = (featureName) => {
        setSelectedFeature(prev => prev === featureName ? null : featureName);
        trackEvent('bar_chart_click');
    };

    const handleRefresh = () => {
        fetchAnalytics();
        trackEvent('filter_apply');
        toast.success('Data refreshed');
    };

    const handleClearFilters = () => {
        setFilters({ start_date: '', end_date: '', age_group: 'All', gender: 'All' });
        setSelectedFeature(null);
        setFeatureSearch('');
        Cookies.remove(COOKIE_KEY);
        toast.success('Filters cleared');
    };

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchAnalytics, 10000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchAnalytics]);

    const handleExportCSV = () => {
        if (!analyticsData) return;
        let csv = "data:text/csv;charset=utf-8,";
        csv += "Summary\n";
        csv += `Total Clicks,${analyticsData.summary?.total_clicks || 0}\n`;
        csv += `Active Users,${analyticsData.summary?.unique_users || 0}\n`;
        csv += `Unique Features,${analyticsData.summary?.unique_features || 0}\n\n`;
        csv += "Feature Name,Total Clicks\n";
        (analyticsData.bar_chart || []).forEach(item => {
            csv += `"${item.feature_name}",${item.total_clicks}\n`;
        });
        csv += `\nDate,Clicks\n`;
        (analyticsData.line_chart || []).forEach(item => {
            csv += `"${item.date}",${item.click_count}\n`;
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", "analytics_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        trackEvent('export_csv');
        toast.success("Exported to CSV");
    };

    const today = formatDate(new Date());
    const summary = analyticsData?.summary;
    const trend = summary?.trend_percent;

    // filter bar chart data by search query
    const filteredBarData = (analyticsData?.bar_chart || []).filter(item =>
        item.feature_name.toLowerCase().includes(featureSearch.toLowerCase())
    );

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="header-logo">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="10" fill="url(#hdr-grad)" />
                            <path d="M12 28V18L20 12L28 18V28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 28V22H24V28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="20" cy="17" r="2" fill="white" />
                            <defs>
                                <linearGradient id="hdr-grad" x1="0" y1="0" x2="40" y2="40">
                                    <stop stopColor="#6366f1" />
                                    <stop offset="1" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <h1>Vigility Analytics</h1>
                    </div>
                </div>
                <div className="header-right">
                    <div className="user-badge">
                        <span className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                        <span className="user-name">{user?.username}</span>
                    </div>
                    <button className="btn-ghost" onClick={logout}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card stat-card-primary">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{summary?.total_clicks ?? '—'}</span>
                        <span className="stat-label">Total Clicks</span>
                    </div>
                    {trend !== null && trend !== undefined && (
                        <span className={`stat-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
                            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
                <div className="stat-card stat-card-secondary">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{summary?.unique_users ?? '—'}</span>
                        <span className="stat-label">Active Users</span>
                    </div>
                </div>
                <div className="stat-card stat-card-accent">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{summary?.unique_features ?? '—'}</span>
                        <span className="stat-label">Features Tracked</span>
                    </div>
                </div>
                <div className="stat-card stat-card-session">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{formatSeconds(summary?.avg_session_time)}</span>
                        <span className="stat-label">Avg Session</span>
                    </div>
                </div>
            </div>

            <div className="filters-section">
                <div className="filters-header">
                    <h2>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        Filters
                    </h2>
                    <div className="filters-actions">
                        <button className={`btn-outline btn-sm ${autoRefresh ? 'active-refresh' : ''}`} onClick={() => { setAutoRefresh(!autoRefresh); trackEvent('toggle_auto_refresh'); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
                        </button>
                        <button className="btn-outline btn-sm" onClick={handleExportCSV}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export CSV
                        </button>
                        <button className="btn-outline btn-sm" onClick={handleClearFilters}>Clear All</button>
                        <button className="btn-primary btn-sm" onClick={handleRefresh}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
                <div className="filters-grid">
                    <div className="filter-item">
                        <label htmlFor="start_date">Start Date</label>
                        <input id="start_date" type="date" value={filters.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)} max={filters.end_date || today} />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="end_date">End Date</label>
                        <input id="end_date" type="date" value={filters.end_date} onChange={(e) => handleFilterChange('end_date', e.target.value)} min={filters.start_date} max={today} />
                    </div>
                    <div className="filter-item">
                        <label htmlFor="age_group">Age Group</label>
                        <select id="age_group" value={filters.age_group} onChange={(e) => handleFilterChange('age_group', e.target.value)}>
                            <option value="All">All Ages</option>
                            <option value="<18">Under 18</option>
                            <option value="18-40">18 - 40</option>
                            <option value=">40">Over 40</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label htmlFor="gender">Gender</label>
                        <select id="gender" value={filters.gender} onChange={(e) => handleFilterChange('gender', e.target.value)}>
                            <option value="All">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                {selectedFeature && (
                    <div className="active-filter-tag">
                        <span>Feature: <strong>{selectedFeature}</strong></span>
                        <button onClick={() => setSelectedFeature(null)} className="tag-close" aria-label="Clear feature filter">×</button>
                    </div>
                )}
            </div>

            {/* heatmap - full width */}
            <div className="chart-card heatmap-card">
                <div className="chart-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Activity (Last 90 Days)
                    </h3>
                </div>
                <div className="chart-body">
                    {loading ? (
                        <div className="chart-loading"><p>Loading heatmap...</p></div>
                    ) : (
                        <ActivityHeatmap data={analyticsData?.heatmap || []} />
                    )}
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            Feature Usage
                        </h3>
                        <div className="chart-header-actions">
                            <input
                                type="text"
                                className="feature-search"
                                placeholder="Search features..."
                                value={featureSearch}
                                onChange={(e) => { setFeatureSearch(e.target.value); trackEvent('feature_search'); }}
                            />
                        </div>
                    </div>
                    <div className="chart-body">
                        {loading ? (
                            <div className="chart-loading">
                                <div className="loading-bars"><span></span><span></span><span></span><span></span><span></span></div>
                                <p>Loading chart data...</p>
                            </div>
                        ) : (
                            <BarChart data={filteredBarData} selectedFeature={selectedFeature} onBarClick={handleBarClick} />
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Time Trend
                            {selectedFeature && <span className="feature-tag">{selectedFeature}</span>}
                        </h3>
                        <span className="chart-subtitle">
                            {selectedFeature ? `Daily clicks for "${selectedFeature}"` : 'Daily click activity across all features'}
                        </span>
                    </div>
                    <div className="chart-body">
                        {loading ? (
                            <div className="chart-loading">
                                <div className="loading-bars"><span></span><span></span><span></span><span></span><span></span></div>
                                <p>Loading chart data...</p>
                            </div>
                        ) : (
                            <LineChart data={analyticsData?.line_chart || []} featureName={selectedFeature} />
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <div className="header-with-tabs">
                            <h3>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    <path d="M2 12h20" />
                                </svg>
                                Demographics
                            </h3>
                            <div className="tabs-pill">
                                <button className={`tab-btn ${demographicTab === 'gender' ? 'active' : ''}`} onClick={() => setDemographicTab('gender')}>Gender</button>
                                <button className={`tab-btn ${demographicTab === 'age' ? 'active' : ''}`} onClick={() => setDemographicTab('age')}>Age</button>
                            </div>
                        </div>
                    </div>
                    <div className="chart-body">
                        {loading ? (
                            <div className="chart-loading"><p>Loading demographics...</p></div>
                        ) : demographicTab === 'gender' ? (
                            <PieChart data={analyticsData?.pie_chart_gender || []} labelKey="gender" valueKey="count" />
                        ) : (
                            <PieChart data={analyticsData?.pie_chart_age || []} labelKey="age_range" valueKey="count" />
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                            </svg>
                            Top Users
                        </h3>
                        <span className="chart-subtitle">Most active users by interactions</span>
                    </div>
                    <div className="chart-body no-padding">
                        {loading ? (
                            <div className="chart-loading"><p>Loading leaderboard...</p></div>
                        ) : (
                            <TopUsers data={analyticsData?.top_users || []} />
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Feature Time
                        </h3>
                        <span className="chart-subtitle">Time spent per feature</span>
                    </div>
                    <div className="chart-body no-padding">
                        {loading ? (
                            <div className="chart-loading"><p>Loading time data...</p></div>
                        ) : (
                            <FeatureTimeList data={analyticsData?.time_spent || []} />
                        )}
                    </div>
                </div>

                <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                    <div className="chart-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Recent Activity
                        </h3>
                        <span className="chart-subtitle">Latest actions from all users</span>
                    </div>
                    <div className="chart-body no-padding">
                        {loading ? (
                            <div className="chart-loading"><p>Loading activity...</p></div>
                        ) : (
                            <RecentActivity data={analyticsData?.recent_activity || []} />
                        )}
                    </div>
                </div>
            </div>

            <footer className="dashboard-footer">
                <p>&copy; {new Date().getFullYear()} Vigility Technology. All rights reserved.</p>
            </footer>
        </div>
    );
}
