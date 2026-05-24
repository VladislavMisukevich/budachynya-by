import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { trackerApi } from '../api/tracker.api';
import { TrackerPlan } from '../types/tracker';
import Layout from '../components/Layout';
import '../styles/tracker.css';

const SPHERES = ['IT', 'Медицина', 'Инженерия', 'Экономика', 'Юриспруденция', 'Педагогика', 'Архитектура', 'Другое'];
const UNIVERSITIES = ['БГУИР', 'БГУ', 'БНТУ', 'БГМУ', 'БГЭУ', 'БГА', 'БГТУ', 'Другой'];

const priorityColor = (p: string) =>
  p === 'high' ? 'var(--danger)' : p === 'medium' ? 'var(--warning)' : 'var(--success)';

const priorityLabel = (p: string) =>
  p === 'high' ? 'Важно' : p === 'medium' ? 'Средне' : 'Желательно';

const feasibilityInfo = (f: string) => {
  if (f === 'high') return { label: 'Высокие шансы', color: 'var(--success)', bg: 'var(--success-subtle)' };
  if (f === 'medium') return { label: 'Средние шансы', color: 'var(--warning)', bg: 'var(--warning-subtle)' };
  return { label: 'Низкие шансы', color: 'var(--danger)', bg: 'var(--danger-subtle)' };
};

const TrackerPage = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [plan, setPlan] = useState<TrackerPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sphere, setSphere] = useState('IT');
  const [university, setUniversity] = useState('БГУИР');
  const [togglingIndex, setTogglingIndex] = useState<number | null>(null);

  useEffect(() => {
    trackerApi.get().then(({ plan }) => {
      setPlan(plan);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { plan } = await trackerApi.generate(sphere, university);
      setPlan(plan);
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (index: number) => {
    setTogglingIndex(index);
    try {
      const { plan: updated } = await trackerApi.toggleStep(index);
      setPlan(updated);
    } finally {
      setTogglingIndex(null);
    }
  };

  const doneCount = plan?.steps.filter(s => s.done).length || 0;
  const totalCount = plan?.steps.length || 0;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div className="tracker-page">
        <div className="tracker-header">
          <div>
            <h1 className="tracker-title">Карьерный трекер</h1>
            <p className="tracker-sub">
              {plan
                ? `${plan.targetUniversity} · ${plan.targetSpecialty}`
                : 'Персональная дорожная карта поступления'}
            </p>
          </div>
          <button className="btn-generate" onClick={() => setShowForm(!showForm)}>
            {plan ? '↻ Перегенерировать' : '✦ Создать план'}
          </button>
        </div>

        {showForm && (
          <div className="generate-form">
            <p className="generate-form-title">Настройки плана</p>
            <div className="generate-form-row">
              <div className="field">
                <label className="field-label">Желаемая сфера</label>
                <select className="field-input" value={sphere} onChange={e => setSphere(e.target.value)}>
                  {SPHERES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Желаемый вуз</label>
                <select className="field-input" value={university} onChange={e => setUniversity(e.target.value)}>
                  {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button className="btn-confirm" onClick={handleGenerate} disabled={generating}>
                {generating ? '⏳ AI составляет план...' : '→ Создать'}
              </button>
            </div>
            {generating && (
              <p className="generating-hint">
                AI анализирует твой профиль и составляет персональный план... (~15 сек)
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="tracker-empty">
            <p>Загружаем план...</p>
          </div>
        )}

        {!loading && !plan && !showForm && (
          <div className="tracker-empty">
            <div className="tracker-empty-icon">🗺️</div>
            <h2 className="tracker-empty-title">План ещё не создан</h2>
            <p className="tracker-empty-sub">
              AI проанализирует твои оценки, достижения и пожелания —
              и составит пошаговый план поступления в выбранный вуз.
            </p>
            <button className="btn-generate-big" onClick={() => setShowForm(true)}>
              ✦ Создать карьерный план
            </button>
          </div>
        )}

        {plan && (
          <>
            <div className="tracker-overview">
              <div className="overview-card overview-card--target">
                <div className="overview-label">Цель</div>
                <div className="overview-value">{plan.targetUniversity}</div>
                <div className="overview-sub">{plan.targetFaculty}</div>
                <div className="overview-specialty">{plan.targetSpecialty}</div>
              </div>

              <div className="overview-card">
                <div className="overview-label">Проходной балл</div>
                <div className="overview-value">{plan.requiredScore}</div>
                <div className="overview-sub">из 400</div>
              </div>

              <div className="overview-card">
                <div className="overview-label">Текущая оценка</div>
                <div className="overview-value">{plan.currentScore}</div>
                <div className="overview-sub">
                  {plan.gap > 0 ? `нужно +${plan.gap}` : 'цель достигнута!'}
                </div>
              </div>

              <div className="overview-card">
                <div className="overview-label">Шансы</div>
                <div
                  className="overview-value"
                  style={{ color: feasibilityInfo(plan.feasibility).color }}
                >
                  {feasibilityInfo(plan.feasibility).label}
                </div>
                <div className="overview-sub feasibility-text">{plan.feasibilityText}</div>
              </div>
            </div>

            <div className="tracker-grid">
              <div className="tracker-main">
                <div className="steps-header">
                  <span className="steps-title">Дорожная карта</span>
                  <span className="steps-progress-text">{doneCount} / {totalCount} выполнено</span>
                </div>

                <div className="progress-bar-wrap">
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="progress-pct">{progress}%</span>
                </div>

                <div className="steps-list">
                  {plan.steps.map((step, i) => (
                    <div
                      key={i}
                      className={`step-item ${step.done ? 'step-item--done' : ''}`}
                      onClick={() => handleToggle(i)}
                    >
                      <div className="step-check">
                        {togglingIndex === i
                          ? <span className="step-spinner">⟳</span>
                          : step.done
                          ? <span className="step-checkmark">✓</span>
                          : <span className="step-circle" />}
                      </div>
                      <div className="step-content">
                        <div className="step-top">
                          <span className="step-month">{step.month}</span>
                          <span
                            className="step-priority"
                            style={{ color: priorityColor(step.priority) }}
                          >
                            {priorityLabel(step.priority)}
                          </span>
                        </div>
                        <div className="step-title">{step.title}</div>
                        <div className="step-desc">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tracker-side">
                <div className="side-panel">
                  <div className="side-panel-title">Сильные предметы</div>
                  <div className="subjects-list">
                    {plan.strongSubjects.map(s => (
                      <div key={s} className="subject-tag subject-tag--strong">↑ {s}</div>
                    ))}
                    {plan.strongSubjects.length === 0 && (
                      <p className="subjects-empty">Внеси больше оценок</p>
                    )}
                  </div>
                </div>

                <div className="side-panel">
                  <div className="side-panel-title">Подтянуть</div>
                  <div className="subjects-list">
                    {plan.weakSubjects.map(s => (
                      <div key={s} className="subject-tag subject-tag--weak">↓ {s}</div>
                    ))}
                    {plan.weakSubjects.length === 0 && (
                      <p className="subjects-empty">Всё хорошо!</p>
                    )}
                  </div>
                </div>

                <div className="side-panel">
                  <div className="side-panel-title">Прогресс</div>
                  <div className="progress-circle-wrap">
                    <svg viewBox="0 0 80 80" className="progress-circle">
                      <circle cx="40" cy="40" r="32" fill="none"
                        stroke="var(--bg-tertiary)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="32" fill="none"
                        stroke="var(--accent)" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress / 100)}`}
                        transform="rotate(-90 40 40)"
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                      <text x="40" y="44" textAnchor="middle"
                        fontSize="14" fontWeight="700" fill="var(--text-primary)">
                        {progress}%
                      </text>
                    </svg>
                  </div>
                  <p className="progress-label">{doneCount} из {totalCount} шагов</p>
                </div>

                <div className="side-panel">
                  <div className="side-panel-title">Информация</div>
                  <div className="info-row">
                    <span className="info-label">Создан</span>
                    <span className="info-val">
                      {new Date(plan.generatedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Ученик</span>
                    <span className="info-val">{user?.firstName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Класс</span>
                    <span className="info-val">{user?.schoolGrade}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default TrackerPage;
