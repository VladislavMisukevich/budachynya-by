import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/authSlice';

const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.navTitle}>Будучыня.BY</span>
        <div style={styles.navLinks}>
          <Link to="/grades" style={styles.navLink}>Мои оценки</Link>
          <Link to="/chatbot" style={styles.navLink}>AI-Навигатор</Link>
          <button onClick={handleLogout} style={styles.logoutBtn}>Выйти</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.welcome}>
          <h1 style={styles.greeting}>
            Привет, {user?.firstName}! 👋
          </h1>
          <p style={styles.gradeInfo}>
            {user?.schoolGrade} класс {user?.city ? `· ${user.city}` : ''}
          </p>
        </div>

        <div style={styles.cards}>
          <Link to="/grades" style={styles.card}>
            <div style={styles.cardIcon}>📊</div>
            <h3 style={styles.cardTitle}>Мои оценки</h3>
            <p style={styles.cardDesc}>Введи свои оценки по предметам</p>
          </Link>

          <Link to="/chatbot" style={styles.card}>
            <div style={styles.cardIcon}>🤖</div>
            <h3 style={styles.cardTitle}>AI-Навигатор</h3>
            <p style={styles.cardDesc}>Задай вопрос про вузы и профессии РБ</p>
          </Link>

          <div style={{ ...styles.card, opacity: 0.6, cursor: 'not-allowed' }}>
            <div style={styles.cardIcon}>🗺️</div>
            <h3 style={styles.cardTitle}>Карьерный трекер</h3>
            <p style={styles.cardDesc}>Скоро: твоя дорожная карта</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: {
    background: '#0f3460',
    padding: '0 32px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navTitle: { color: '#fff', fontWeight: '700', fontSize: '18px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
  navLink: { color: '#fff', textDecoration: 'none', fontSize: '14px' },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  main: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px' },
  welcome: { marginBottom: '32px' },
  greeting: { fontSize: '32px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' },
  gradeInfo: { color: '#666', fontSize: '16px', margin: 0 },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px',
    textDecoration: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'block',
    cursor: 'pointer',
  },
  cardIcon: { fontSize: '36px', marginBottom: '12px' },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 8px' },
  cardDesc: { fontSize: '14px', color: '#666', margin: 0 },
};

export default DashboardPage;
