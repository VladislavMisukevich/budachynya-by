import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { registerThunk, clearError } from '../store/authSlice';

const RegisterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    schoolGrade: 11,
    city: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    dispatch(clearError());
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      registerThunk({ ...form, schoolGrade: Number(form.schoolGrade) })
    );
    if (registerThunk.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Будучыня.BY</h1>
        <p style={styles.subtitle}>Навігатар талентаў</p>
        <h2 style={styles.formTitle}>Регистрация</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Имя</label>
              <input
                style={styles.input}
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Иван"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Фамилия</label>
              <input
                style={styles.input}
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Петров"
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Пароль (минимум 6 символов)</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••"
              required
              minLength={6}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Класс</label>
              <select
                style={styles.input}
                name="schoolGrade"
                value={form.schoolGrade}
                onChange={handleChange}
                required
              >
                {[9, 10, 11].map((g) => (
                  <option key={g} value={g}>{g} класс</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Город</label>
              <input
                style={styles.input}
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Минск"
              />
            </div>
          </div>

          <button style={styles.button} type="submit" disabled={isLoading}>
            {isLoading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p style={styles.link}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={styles.linkText}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f3460',
    margin: '0 0 4px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
    margin: '0 0 24px',
  },
  formTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 20px',
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#444',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#0f3460',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  link: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#666',
  },
  linkText: {
    color: '#0f3460',
    fontWeight: '600',
    textDecoration: 'none',
  },
};

export default RegisterPage;
