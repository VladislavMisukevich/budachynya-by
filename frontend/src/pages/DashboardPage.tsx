import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { getMeThunk } from '../store/authSlice';
import { fetchGradesThunk, fetchExamsThunk } from '../store/gradesSlice';
import { aiApi } from '../api/ai.api';
import Layout from '../components/Layout';
import '../styles/dashboard.css';

let globalBaseline: string | null = null;

const criLabel = (cri: number) => {
  if (cri >= 80) return { text: 'Отличная готовность', color: 'var(--success)' };
  if (cri >= 60) return { text: 'Хорошая готовность', color: 'var(--accent)' };
  if (cri >= 40) return { text: 'Средняя готовность', color: 'var(--warning)' };
  return { text: 'Нужно подтянуть', color: 'var(--danger)' };
};

const scoreColor = (s: number) =>
  s >= 9 ? 'var(--success)' : s >= 7 ? 'var(--accent)' : s >= 5 ? 'var(--warning)' : 'var(--danger)';

const makeSnapshot = (
  grades: { id: string; quarter1?: number|null; quarter2?: number|null; quarter3?: number|null; quarter4?: number|null; yearScore?: number|null; finalScore?: number|null }[],
  exams: { id: string; score: number }[]
) => {
  const g = grades.map(g =>
    `${g.id}:${g.quarter1??''},${g.quarter2??''},${g.quarter3??''},${g.quarter4??''},${g.yearScore??''},${g.finalScore??''}`
  ).sort().join('|');
  const e = exams.map(e => `${e.id}:${e.score}`).sort().join('|');
  return `${g}::${e}`;
};

const CRIGauge = ({ value }: { value: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const w = canvas.width, h = canvas.height, cx = w/2, cy = h*0.75, r = w*0.38;
    ctx.clearRect(0,0,w,h);
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const track = dark ? '#21262d' : '#eaeef2';
    const txtColor = dark ? '#e6edf3' : '#1f2328';
    const muted = dark ? '#7d8590' : '#9198a1';
    ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,2*Math.PI);
    ctx.lineWidth=16; ctx.strokeStyle=track; ctx.lineCap='round'; ctx.stroke();
    if (value > 0) {
      const fill = ctx.createLinearGradient(cx-r,0,cx+r,0);
      if (value>=80){fill.addColorStop(0,'#1a7f37');fill.addColorStop(1,'#3fb950');}
      else if (value>=60){fill.addColorStop(0,'#0550ae');fill.addColorStop(1,'#2f81f7');}
      else if (value>=40){fill.addColorStop(0,'#9a6700');fill.addColorStop(1,'#d29922');}
      else {fill.addColorStop(0,'#a32d2d');fill.addColorStop(1,'#f85149');}
      ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,Math.PI+(value/100)*Math.PI);
      ctx.lineWidth=16; ctx.strokeStyle=fill; ctx.lineCap='round'; ctx.stroke();
    }
    ctx.fillStyle=txtColor; ctx.font=`700 ${w*0.14}px -apple-system,sans-serif`;
    ctx.textAlign='center'; ctx.fillText(`${value}%`,cx,cy-r*0.05);
    ctx.fillStyle=muted; ctx.font=`400 ${w*0.07}px -apple-system,sans-serif`;
    ctx.fillText('CRI',cx,cy+r*0.28);
    ctx.font=`400 ${w*0.065}px -apple-system,sans-serif`;
    ctx.fillText('0',cx-r-4,cy+14); ctx.fillText('100',cx+r+4,cy+14);
  }, [value]);
  return <canvas ref={ref} width={200} height={120} className="cri-canvas" />;
};

const BarChart = ({ grouped }: { grouped: {subject:string;average:number}[] }) => {
  const top = [...grouped].sort((a,b)=>b.average-a.average).slice(0,6);
  if (!top.length) return <div className="chart-empty">Добавь оценки чтобы увидеть график</div>;
  return (
    <div className="bar-chart">
      {top.map(item => (
        <div key={item.subject} className="bar-row">
          <span className="bar-label">{item.subject}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{width:`${item.average/10*100}%`,background:scoreColor(item.average)}} />
          </div>
          <span className="bar-value" style={{color:scoreColor(item.average)}}>{item.average}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const { grades, examScores } = useSelector((s: RootState) => s.grades);

  const [cri, setCri] = useState<number | null>(null);
  const [criLoading, setCriLoading] = useState(false);
  const [criChanged, setCriChanged] = useState(false);
  const [recalcResult, setRecalcResult] = useState<{
    changed: boolean; reason: string; newCRI: number;
  } | null>(null);

  useEffect(() => {
    if (!user) dispatch(getMeThunk());
    dispatch(fetchGradesThunk());
    dispatch(fetchExamsThunk());
    aiApi.loadCRI().then(({ cri }) => { if (cri !== null) setCri(cri); }).catch(() => {});
  }, [dispatch, user]);

  useEffect(() => {
    if (grades.length === 0 && examScores.length === 0) return;
    const current = makeSnapshot(grades, examScores);
    if (globalBaseline === null) {
      globalBaseline = current;
      return;
    }
    setCriChanged(current !== globalBaseline);
  }, [grades, examScores]);

  const buildDetailedData = useCallback(() => {
    const gradeLines = grades.map(g => {
      const all = [g.quarter1, g.quarter2, g.quarter3, g.quarter4, g.yearScore, g.finalScore]
        .filter((v): v is number => v !== null && v !== undefined);
      const avg = all.length ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(1) : 'нет';
      const parts = [
        g.quarter1 != null ? `I:${g.quarter1}` : null,
        g.quarter2 != null ? `II:${g.quarter2}` : null,
        g.quarter3 != null ? `III:${g.quarter3}` : null,
        g.quarter4 != null ? `IV:${g.quarter4}` : null,
        g.yearScore != null ? `год:${g.yearScore}` : null,
        g.finalScore != null ? `итог:${g.finalScore}` : null,
      ].filter(Boolean).join(', ');
      return `  ${g.subject}: ${parts || 'нет оценок'} → среднее: ${avg}`;
    }).join('\n');

    const allScores = grades.flatMap(g =>
      [g.quarter1, g.quarter2, g.quarter3, g.quarter4, g.yearScore, g.finalScore]
        .filter((v): v is number => v !== null && v !== undefined)
    );
    const overallAvg = allScores.length
      ? (allScores.reduce((a,b)=>a+b,0)/allScores.length).toFixed(2) : '0';

    const examLines = examScores.length
      ? examScores.map(e => `  ${e.examType} ${e.subject}: ${e.score}/100`).join('\n')
      : '  нет';

    return `Предметов с оценками: ${grades.length} из 16
Общий средний балл: ${overallAvg} из 10
Увлечения: ${user?.hobbies || 'не указаны'}
Достижения: ${user?.achievements || 'не указаны'}
Характеристика: ${user?.characteristic || 'не указана'}

Оценки:
${gradeLines || '  нет'}

ЦЭ/ЦТ/РТ:
${examLines}`;
  }, [grades, examScores, user]);

  const handleRecalc = useCallback(async () => {
    setCriLoading(true);
    setRecalcResult(null);
    try {
      const data = buildDetailedData();
      const result = await aiApi.recalcCRI(data);
      setCri(result.newCRI);
      setRecalcResult({ changed: result.changed, reason: result.reason, newCRI: result.newCRI });
      globalBaseline = makeSnapshot(grades, examScores);
      setCriChanged(false);
    } catch {
      setRecalcResult({ changed: false, reason: 'Ошибка соединения с AI', newCRI: cri ?? 0 });
    } finally {
      setCriLoading(false);
    }
  }, [grades, examScores, cri, buildDetailedData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  const grouped = Object.values(
    grades.reduce((acc, g) => {
      if (!acc[g.subject]) acc[g.subject] = { subject: g.subject, scores: [] };
      const quarters = [g.quarter1, g.quarter2, g.quarter3, g.quarter4]
        .filter((q): q is number => q !== null && q !== undefined);
      const best = g.finalScore ?? g.yearScore ??
        (quarters.length ? quarters.reduce((a,b)=>a+b,0)/quarters.length : null);
      if (best !== null) acc[g.subject].scores.push(best as number);
      return acc;
    }, {} as Record<string, {subject:string;scores:number[]}>)
  ).map(({subject, scores}) => ({
    subject,
    average: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10 : 0,
  })).filter(g => g.average > 0);

  const avgScore = grouped.length
    ? (grouped.reduce((s,g)=>s+g.average,0)/grouped.length).toFixed(1) : '—';
  const topSubject = grouped.length ? grouped.reduce((a,b)=>a.average>b.average?a:b) : null;
  const weakSubject = grouped.length > 1 ? grouped.reduce((a,b)=>a.average<b.average?a:b) : null;
  const avgExam = examScores.length
    ? Math.round(examScores.reduce((s,e)=>s+e.score,0)/examScores.length) : null;
  const criInfo = cri !== null ? criLabel(cri) : null;

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              {greeting}{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="dashboard-sub">
              {user?.schoolGrade ? `${user.schoolGrade} класс` : ''}
              {user?.city ? ` · ${user.city}` : ''}
              {' · Будучыня.BY'}
            </p>
          </div>
          <Link to="/grades" className="header-action">+ Добавить оценку</Link>
        </div>

        <div className="dashboard-grid">
          <div className="grid-main">
            <div className="stats-row">
              <div className="stat">
                <span className="stat-value">{avgScore}</span>
                <span className="stat-label">Средний балл</span>
              </div>
              <div className="stat">
                <span className="stat-value">{grades.length}</span>
                <span className="stat-label">Предметов</span>
              </div>
              <div className="stat">
                <span className="stat-value">{avgExam ?? '—'}</span>
                <span className="stat-label">Средний ЦЭ/ЦТ</span>
              </div>
              <div className="stat">
                <span className="stat-value" style={{ color: criInfo?.color }}>
                  {cri !== null ? `${cri}%` : '—'}
                </span>
                <span className="stat-label">CRI индекс</span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Успеваемость по предметам</span>
                <Link to="/grades" className="panel-link">Все оценки →</Link>
              </div>
              <BarChart grouped={grouped} />
            </div>

            {(topSubject || weakSubject) && (
              <div className="insights-row">
                {topSubject && (
                  <div className="insight insight--success">
                    <span className="insight-icon">↑</span>
                    <div>
                      <span className="insight-label">Сильный предмет</span>
                      <span className="insight-value">{topSubject.subject} — {topSubject.average}</span>
                    </div>
                  </div>
                )}
                {weakSubject && weakSubject.subject !== topSubject?.subject && (
                  <div className="insight insight--warning">
                    <span className="insight-icon">↓</span>
                    <div>
                      <span className="insight-label">Подтянуть</span>
                      <span className="insight-value">{weakSubject.subject} — {weakSubject.average}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="nav-cards">
              <Link to="/grades" className="nav-card">
                <span className="nav-card-icon">◫</span>
                <div>
                  <div className="nav-card-title">Журнал оценок</div>
                  <div className="nav-card-desc">Четверти · Год · Итог · ЦЭ/ЦТ/РТ</div>
                </div>
                <span className="nav-card-arrow">→</span>
              </Link>
              <Link to="/chatbot" className="nav-card">
                <span className="nav-card-icon">◈</span>
                <div>
                  <div className="nav-card-title">AI-Навигатор</div>
                  <div className="nav-card-desc">Вузы · ЦЭ · ЦТ · РТ · Карьера</div>
                </div>
                <span className="nav-card-arrow">→</span>
              </Link>
              <Link to="/tracker" className="nav-card">
                <span className="nav-card-icon">◉</span>
                <div>
                  <div className="nav-card-title">Карьерный трекер</div>
                  <div className="nav-card-desc">Дорожная карта поступления</div>
                </div>
                <span className="nav-card-arrow">→</span>
              </Link>
            </div>
          </div>

          <div className="grid-side">
            <div className="panel cri-panel">
              <div className="panel-header">
                <span className="panel-title">Индекс готовности</span>
                {criChanged && (
                  <span className="cri-changed-dot" title="Данные изменились">●</span>
                )}
              </div>
              <div className="cri-gauge-wrap">
                <CRIGauge value={cri ?? 0} />
              </div>
              <div className="cri-status" style={{ color: criInfo?.color || 'var(--text-muted)' }}>
                {cri !== null ? criInfo?.text : 'Не рассчитан'}
              </div>

              <button
                className={`cri-calc-btn ${criChanged ? 'cri-calc-btn--active' : ''}`}
                onClick={handleRecalc}
                disabled={criLoading || !criChanged}
              >
                {criLoading
                  ? '⏳ AI анализирует...'
                  : criChanged ? '✦ Пересчитать CRI' : '✓ CRI актуален'}
              </button>

              {recalcResult && (
                <div className={`recalc-badge ${recalcResult.changed ? 'recalc-badge--changed' : 'recalc-badge--same'}`}>
                  <div className="recalc-badge-title">
                    {recalcResult.changed
                      ? `CRI обновлён → ${recalcResult.newCRI}%`
                      : 'CRI не изменился'}
                  </div>
                  <div className="recalc-badge-reason">{recalcResult.reason}</div>
                </div>
              )}

              <div className="cri-breakdown">
                <div className="cri-row">
                  <span className="cri-row-label">Средний балл</span>
                  <span className="cri-row-val">{avgScore} / 10</span>
                </div>
                <div className="cri-row">
                  <span className="cri-row-label">Предметов внесено</span>
                  <span className="cri-row-val">{grades.length} / 16</span>
                </div>
                <div className="cri-row">
                  <span className="cri-row-label">ЦЭ/ЦТ/РТ</span>
                  <span className="cri-row-val">{examScores.length} рез.</span>
                </div>
                {user?.achievements && (
                  <div className="cri-row">
                    <span className="cri-row-label">Достижения</span>
                    <span className="cri-row-val" style={{ color: 'var(--success)' }}>✓</span>
                  </div>
                )}
              </div>
              <div className="cri-hint">
                Кнопка активируется когда меняются оценки или ЦЭ/ЦТ/РТ
              </div>
            </div>

            <div className="panel coming-panel">
              <div className="panel-title" style={{ marginBottom: 12 }}>Разделы</div>

              <Link to="/tracker" className="coming-item coming-item--active">
                <span className="coming-icon">◉</span>
                <div>
                  <div className="coming-title">Карьерный трекер</div>
                  <div className="coming-desc">Дорожная карта поступления</div>
                </div>
              </Link>

              <div className="coming-item coming-item--soon">
                <span className="coming-icon">◎</span>
                <div>
                  <div className="coming-title">B2B Контракты</div>
                  <div className="coming-desc">Целевые предложения предприятий</div>
                </div>
                <span className="coming-badge">Скоро</span>
              </div>

              <div className="coming-item coming-item--soon">
                <span className="coming-icon">◈</span>
                <div>
                  <div className="coming-title">Репетиторы</div>
                  <div className="coming-desc">Маркетплейс по слабым предметам</div>
                </div>
                <span className="coming-badge">Скоро</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
