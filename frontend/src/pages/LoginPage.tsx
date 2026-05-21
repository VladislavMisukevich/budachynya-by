import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { loginThunk, clearError } from '../store/authSlice';
import '../styles/auth.css';

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(clearError());
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginThunk(form));
    if (loginThunk.fulfilled.match(result)) navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">Б</span>
          <span className="auth-logo-text">Будучыня.BY</span>
        </div>
        <h1 className="auth-title">Вход в аккаунт</h1>
        <p className="auth-sub">Навігатар талентаў Беларусі</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Пароль</label>
            <input
              className="field-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="auth-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="auth-link">
          Нет аккаунта?{' '}
          <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
