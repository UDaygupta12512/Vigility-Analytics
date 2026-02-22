const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:5000' : '';

function getToken() {
    return localStorage.getItem('analytics_token');
}

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export async function login(username, password) {
    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

export async function register(username, password, age, gender) {
    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, age: Number(age), gender }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
}

export async function trackEvent(featureName) {
    try {
        await fetch(`${API_BASE}/track`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ feature_name: featureName }),
        });
    } catch (err) {
        console.warn('Track event failed:', err);
    }
}

export async function trackTime(featureName, duration) {
    try {
        await fetch(`${API_BASE}/track-time`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ feature_name: featureName, duration }),
        });
    } catch (err) {
        console.warn('Track time failed:', err);
    }
}

export async function getAnalytics(filters = {}) {
    const params = new URLSearchParams();
    if (filters.start_date) params.set('start_date', filters.start_date);
    if (filters.end_date) params.set('end_date', filters.end_date);
    if (filters.age_group) params.set('age_group', filters.age_group);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.feature_name) params.set('feature_name', filters.feature_name);

    const res = await fetch(`${API_BASE}/analytics?${params.toString()}`, {
        headers: getHeaders(),
    });

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('analytics_token');
        localStorage.removeItem('analytics_user');
        window.location.reload();
        throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
    return data;
}
