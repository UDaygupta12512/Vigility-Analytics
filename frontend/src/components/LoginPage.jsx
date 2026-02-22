import { useState } from 'react';
import { login, register, trackEvent } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { loginUser } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({
        username: '', password: '', age: '', gender: 'Male',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setForm({ username: '', password: '', age: '', gender: 'Male' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let data;
            if (isRegister) {
                data = await register(form.username, form.password, form.age, form.gender);
                toast.success('Account created successfully!');
                trackEvent('register');
            } else {
                data = await login(form.username, form.password);
                toast.success('Welcome back!');
                trackEvent('login');
            }
            loginUser(data.user, data.token);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
                            <path d="M12 28V18L20 12L28 18V28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 28V22H24V28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="20" cy="17" r="2" fill="white" />
                            <defs>
                                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                                    <stop stopColor="#6366f1" />
                                    <stop offset="1" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="brand-label">Vigility Dashboard</div>
                    <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className="login-subtitle">
                        {isRegister ? 'Enter your details to get started' : 'Sign in to access your dashboard'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username" type="text" name="username"
                            placeholder="Enter your username"
                            value={form.username} onChange={handleChange}
                            required autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password" type="password" name="password"
                            placeholder={isRegister ? "Create a password" : "Enter your password"}
                            value={form.password} onChange={handleChange}
                            required autoComplete={isRegister ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {isRegister && (
                        <div className="register-fields">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="age">Age</label>
                                    <input
                                        id="age" type="number" name="age"
                                        placeholder="Age" value={form.age}
                                        onChange={handleChange} required min="1" max="150"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="gender">Gender</label>
                                    <select id="gender" name="gender" value={form.gender} onChange={handleChange} required>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner"></span>
                                Processing...
                            </span>
                        ) : (isRegister ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        <button type="button" className="btn-link" onClick={toggleMode}>
                            {isRegister ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
