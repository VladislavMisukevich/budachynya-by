import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { logout } from '../store/authSlice';
import '../styles/layout.css';

interface Props { children: ReactNode; }

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⊞', label: 'Главная' },
  { to: '/grades', icon: '◫', label: 'Оценки' },
  { to: '/tracker', icon: '◉', label: 'Трекер' },
  { to: '/chatbot', icon: '◈', label: 'AI-Навигатор' },
  { to: '/profile', icon: '◯', label: 'Профиль' },
];

const Layout = ({ children }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <span className="logo-mark">Б</span>
            <span className="logo-text">Будучыня</span>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="user-block">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-meta">{user?.schoolGrade} класс · {user?.city || 'РБ'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Выйти">⎋</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
