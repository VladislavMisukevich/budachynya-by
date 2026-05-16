import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchGradesThunk, createGradeThunk, deleteGradeThunk } from '../store/gradesSlice';

const SUBJECTS = [
  'Математика','Алгебра','Геометрия','Физика','Химия','Биология',
  'История','География','Русский язык','Белорусский язык',
  'Литература','Английский язык','Информатика','Обществоведение',
];

const SCORE_COLOR = (score: number) => {
  if (score >= 9) return '#16a34a';
  if (score >= 7) return '#2563eb';
  if (score >= 5) return '#d97706';
  return '#dc2626';
};

const GradesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { grades, grouped, isLoading } = useSelector((state: RootState) => state.grades);

  const [form, setForm] = useState({
    subject: 'Математика',
    score: 7,
    quarter: 1,
    year: new Date().getFullYear(),
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchGradesThunk());
  }, [dispatch]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(createGradeThunk({
      ...form,
      score: Number(form.score),
      quarter: Number(form.quarter),
      year: Number(form.year),
    }));
    if (createGradeThunk.fulfilled.match(result)) {
      setShowForm(false);
      dispatch(fetchGradesThunk());
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Удалить оценку?')) {
      dispatch(deleteGradeThunk(id));
      dispatch(fetchGradesThunk());
    }
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.navBack}>← Назад</Link>
        <span style={styles.navTitle}>Будучыня.BY</span>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Отмена' : '+ Добавить оценку'}
        </button>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.title}>Мои оценки</h1>

        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Новая оценка</h3>
            <form onSubmit={handleAdd} style={styles.form}>
              <select
                style={styles.input}
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              >
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                style={styles.input}
                value={form.score}
                onChange={(e) => setForm((p) => ({ ...p, score: Number(e.target.value) }))}
              >
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <select
                style={styles.input}
                value={form.quarter}
                onChange={(e) => setForm((p) => ({ ...p, quarter: Number(e.target.value) }))}
              >
                {[1,2,3,4].map((q) => <option key={q} value={q}>{q} четверть</option>)}
              </select>

              <button type="submit" style={styles.submitBtn} disabled={isLoading}>
                Сохранить
              </button>
            </form>
          </div>
        )}

        {isLoading && <p style={styles.loading}>Загружаем оценки...</p>}

        {!isLoading && grades.length === 0 && (
          <div style={styles.empty}>
            <p>У тебя пока нет оценок.</p>
            <p>Нажми "+ Добавить оценку" чтобы начать!</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.subject} style={styles.groupCard}>
            <div style={styles.groupHeader}>
              <h3 style={styles.groupSubject}>{group.subject}</h3>
              <span style={{
                ...styles.avgBadge,
                background: SCORE_COLOR(group.average),
              }}>
                Средний: {group.average}
              </span>
            </div>
            <div style={styles.gradesList}>
              {group.grades.map((grade) => (
                <div key={grade.id} style={styles.gradeRow}>
                  <span style={{
                    ...styles.scoreBadge,
                    background: SCORE_COLOR(grade.score),
                  }}>
                    {grade.score}
                  </span>
                  <span style={styles.gradeInfo}>
                    {grade.quarter ? `${grade.quarter} четверть · ` : ''}{grade.year}
                  </span>
                  <button
                    onClick={() => handleDelete(grade.id)}
                    style={styles.deleteBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
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
  navBack: { color: '#fff', textDecoration: 'none', fontSize: '14px' },
  navTitle: { color: '#fff', fontWeight: '700', fontSize: '18px' },
  addBtn: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  main: { maxWidth: '800px', margin: '0 auto', padding: '32px 20px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  formCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  formTitle: { margin: '0 0 16px', color: '#1a1a2e' },
  form: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  input: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    flex: '1',
    minWidth: '140px',
  },
  submitBtn: {
    background: '#0f3460',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  loading: { textAlign: 'center', color: '#666', padding: '40px' },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '12px',
  },
  groupCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  groupSubject: { margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a2e' },
  avgBadge: {
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  gradesList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  gradeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  scoreBadge: {
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
    flexShrink: 0,
  },
  gradeInfo: { color: '#666', fontSize: '14px', flex: 1 },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
};

export default GradesPage;
