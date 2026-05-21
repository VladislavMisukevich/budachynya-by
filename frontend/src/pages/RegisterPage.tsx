import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { registerThunk, clearError } from '../store/authSlice';
import { aiApi } from '../api/ai.api';
import '../styles/auth.css';
import '../styles/register.css';

const SUBJECTS_9 = [
  'Белорусский язык','Белорусская литература','Русский язык','Русская литература',
  'Английский язык','Математика','История Беларуси','Всемирная история',
  'Обществоведение','География','Биология','Физика','Химия','Информатика',
  'Трудовое обучение','Физкультура','ОБЖ',
];
const SUBJECTS_10_11 = [
  'Белорусский язык','Белорусская литература','Русский язык','Русская литература',
  'Английский язык','Математика','История Беларуси','Всемирная история',
  'Обществоведение','География','Биология','Физика','Химия','Информатика',
  'Физкультура','ОБЖ',
];
const EXAM_SUBJECTS = [
  'Математика','Физика','Химия','Биология','История Беларуси',
  'Всемирная история','Обществоведение','Английский язык',
  'Русский язык','Белорусский язык','Информатика','География',
];

const getCurrentQuarter = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 9 && m <= 10) return 1;
  if (m >= 11 && m <= 12) return 2;
  if (m >= 1 && m <= 2) return 2;
  if (m >= 3 && m <= 4) return 3;
  return 4;
};

const isPastYear = () => {
  const m = new Date().getMonth() + 1;
  return m >= 6 && m <= 8;
};

const getQuarterLabel = () => {
  if (isPastYear()) return 'итоговые оценки за прошлый год';
  const q = getCurrentQuarter();
  if (q === 1) return 'оценки за 1 четверть';
  if (q === 2) return 'оценки за 1-2 четверти';
  if (q === 3) return 'оценки за 1-3 четверти';
  return 'оценки за все четверти';
};

type GradeMap = Record<string, {
  q1?: number; q2?: number; q3?: number; q4?: number;
  year?: number; final?: number;
}>;
type ExamEntry = { examType: string; subject: string; score: string };

const STEPS = ['Аккаунт', 'Оценки', 'ЦЭ / РТ', 'Профиль'];

const criColor = (v: number) =>
  v >= 80 ? '#1a7f37' : v >= 60 ? '#0969da' : v >= 40 ? '#9a6700' : '#cf222e';

const criLabel = (v: number) =>
  v >= 80 ? 'Отличная готовность!' :
  v >= 60 ? 'Хорошая готовность' :
  v >= 40 ? 'Средняя готовность' : 'Есть над чем работать';

const RegisterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'form' | 'loading' | 'result'>('form');
  const [criValue, setCriValue] = useState(0);
  const [animCri, setAnimCri] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    schoolGrade: 11, city: '',
    hobbies: '', achievements: '', characteristic: '',
  });
  const [gradeMap, setGradeMap] = useState<GradeMap>({});
  const [exams, setExams] = useState<ExamEntry[]>([
    { examType: 'ЦЭ', subject: 'Математика', score: '' },
  ]);

  const subjects = form.schoolGrade <= 9 ? SUBJECTS_9 : SUBJECTS_10_11;
  const quarter = getCurrentQuarter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    dispatch(clearError());
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (name === 'schoolGrade') setGradeMap({});
  };

  const setGradeField = (subject: string, field: string, value: string) => {
    const raw = parseInt(value);
    const num = isNaN(raw) ? undefined : Math.min(10, Math.max(1, raw));
    setGradeMap(p => ({ ...p, [subject]: { ...p[subject], [field]: num } }));
  };

  const addExam = () => setExams(p => [...p, { examType: 'ЦТ', subject: 'Физика', score: '' }]);
  const removeExam = (i: number) => setExams(p => p.filter((_, j) => j !== i));

  const animateTo = (target: number) => {
    let cur = 0;
    const interval = setInterval(() => {
      const step = Math.max(1, Math.ceil((target - cur) / 20));
      cur = Math.min(cur + step, target);
      setAnimCri(cur);
      if (cur >= target) clearInterval(interval);
    }, 40);
  };

  const handleSubmit = async () => {
    const grades = Object.entries(gradeMap)
      .filter(([, v]) => Object.values(v).some(x => x !== undefined))
      .map(([subject, v]) => ({
        subject,
        quarter1: v.q1, quarter2: v.q2,
        quarter3: v.q3, quarter4: v.q4,
        yearScore: v.year, finalScore: v.final,
      }));

    const examScores = exams
      .filter(e => e.score && Number(e.score) > 0)
      .map(e => ({ examType: e.examType, subject: e.subject, score: Number(e.score) }));

    // Шаг 1: регистрируем пользователя
    const result = await dispatch(registerThunk({
      ...form,
      schoolGrade: Number(form.schoolGrade),
      grades,
      examScores,
    }));

    if (!registerThunk.fulfilled.match(result)) return;

    // Шаг 2: СРАЗУ показываем анимацию — до любых API вызовов
    setPhase('loading');
    setLoadingStep(1);

    // Шаг 3: ждём пока React перерисует компонент
    await new Promise(r => setTimeout(r, 100));
    setLoadingStep(2);

    await new Promise(r => setTimeout(r, 600));
    setLoadingStep(3);

    // Шаг 4: вызываем calcInitialCRI — токен уже в localStorage
    try {
      const { cri } = await aiApi.calcInitialCRI();
      setCriValue(cri);
      animateTo(cri);
      // Ждём анимацию счётчика
      await new Promise(r => setTimeout(r, 1200));
      setPhase('result');
    } catch (err) {
      console.error('CRI calc error:', err);
      setCriValue(0);
      setPhase('result');
    }
  };

  const canStep1 = !!(form.firstName && form.lastName && form.email && form.password.length >= 6);

  // ── Loading Screen ──────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="cri-screen">
        <div className="cri-screen-card">
          <div className="cri-screen-logo">
            <span className="auth-logo-mark">Б</span>
            <span className="auth-logo-text">Будучыня.BY</span>
          </div>

          <div className="cri-orbit">
            <div className="cri-orbit-ring" />
            <div className="cri-orbit-ring cri-orbit-ring--2" />
            <div className="cri-orbit-core">
              <span className="cri-orbit-num">
                {animCri > 0 ? animCri : '...'}
              </span>
              {animCri > 0 && <span className="cri-orbit-label">%</span>}
            </div>
          </div>

          <p className="cri-loading-title">AI рассчитывает ваш CRI</p>
          <p className="cri-loading-sub">Анализируем оценки, достижения и профиль...</p>

          <div className="cri-loading-steps">
            <div className={`cri-step ${loadingStep >= 1 ? 'cri-step--done' : 'cri-step--active'}`}>
              {loadingStep >= 1 ? '✓' : '⟳'} Профиль создан
            </div>
            <div className={`cri-step ${loadingStep >= 2 ? 'cri-step--done' : loadingStep === 1 ? 'cri-step--active' : ''}`}>
              {loadingStep >= 2 ? '✓' : loadingStep === 1 ? '⟳' : '○'} Оценки сохранены
            </div>
            <div className={`cri-step ${loadingStep >= 3 ? 'cri-step--active' : ''}`}>
              {loadingStep >= 3 ? '⟳' : '○'} AI анализирует данные...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Result Screen ───────────────────────────────────────────
  if (phase === 'result') {
    const circumference = 2 * Math.PI * 50;
    const offset = circumference * (1 - criValue / 100);

    return (
      <div className="cri-screen">
        <div className="cri-screen-card">
          <div className="cri-screen-logo">
            <span className="auth-logo-mark">Б</span>
            <span className="auth-logo-text">Будучыня.BY</span>
          </div>

          <div className="cri-result-ring">
            <svg viewBox="0 0 120 120" className="cri-svg">
              <circle cx="60" cy="60" r="50" fill="none"
                stroke="var(--bg-tertiary)" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none"
                stroke={criColor(criValue)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <text x="60" y="56" textAnchor="middle" fontSize="22"
                fontWeight="700" fill="var(--text-primary)">{criValue}</text>
              <text x="60" y="70" textAnchor="middle" fontSize="10"
                fill="var(--text-muted)">CRI</text>
            </svg>
          </div>

          <p className="cri-result-title" style={{ color: criColor(criValue) }}>
            {criLabel(criValue)}
          </p>
          <p className="cri-result-sub">
            Твой индекс карьерной готовности — <strong>{criValue}%</strong>.
            Он обновится когда внесёшь новые данные.
          </p>

          <div className="cri-result-tips">
            {criValue < 40 && (
              <div className="cri-tip">💡 Внеси больше оценок — CRI повысится</div>
            )}
            {criValue >= 40 && criValue < 70 && (
              <div className="cri-tip">💡 Добавь достижения в профиле чтобы улучшить CRI</div>
            )}
            {criValue >= 70 && (
              <div className="cri-tip">🎯 Загляни в AI-Навигатор за рекомендациями по вузам</div>
            )}
          </div>

          <button className="cri-goto-btn" onClick={() => navigate('/dashboard')}>
            Перейти на главную →
          </button>
        </div>
      </div>
    );
  }

  // ── Registration Form ───────────────────────────────────────
  return (
    <div className="auth-page">
      <div className={`auth-card ${step >= 1 ? 'auth-card--wide' : ''}`}>
        <div className="auth-logo">
          <span className="auth-logo-mark">Б</span>
          <span className="auth-logo-text">Будучыня.BY</span>
        </div>

        <div className="reg-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`reg-step ${i === step ? 'reg-step--active' : ''} ${i < step ? 'reg-step--done' : ''}`}>
              <div className="reg-step-dot">{i < step ? '✓' : i + 1}</div>
              <span className="reg-step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="reg-step-line" />}
            </div>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 0 && (
          <div className="auth-form">
            <div className="field-row">
              <div className="field">
                <label className="field-label">Имя *</label>
                <input className="field-input" type="text" name="firstName"
                  value={form.firstName} onChange={handleChange} placeholder="Иван" />
              </div>
              <div className="field">
                <label className="field-label">Фамилия *</label>
                <input className="field-input" type="text" name="lastName"
                  value={form.lastName} onChange={handleChange} placeholder="Петров" />
              </div>
            </div>
            <div className="field">
              <label className="field-label">Email *</label>
              <input className="field-input" type="email" name="email"
                value={form.email} onChange={handleChange} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label className="field-label">Пароль * (минимум 6 символов)</label>
              <input className="field-input" type="password" name="password"
                value={form.password} onChange={handleChange} placeholder="••••••••" />
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Класс *</label>
                <select className="field-input" name="schoolGrade"
                  value={form.schoolGrade} onChange={handleChange}>
                  {[9,10,11].map(g => <option key={g} value={g}>{g} класс</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Город</label>
                <input className="field-input" type="text" name="city"
                  value={form.city} onChange={handleChange} placeholder="Минск" />
              </div>
            </div>
            <button className="auth-btn" onClick={() => canStep1 && setStep(1)} disabled={!canStep1}>
              Далее →
            </button>
            <p className="auth-link">Уже есть аккаунт? <Link to="/login">Войти</Link></p>
          </div>
        )}

        {step === 1 && (
          <div className="grades-step">
            <p className="step-desc">
              Внеси {getQuarterLabel()}. Чем больше оценок — тем точнее CRI. Можно пропустить.
            </p>
            <div className="grades-grid-wrap">
              <table className="reg-grades-table">
                <thead>
                  <tr>
                    <th className="rgt-subject">Предмет</th>
                    {quarter >= 1 && <th className="rgt-q">I</th>}
                    {quarter >= 2 && <th className="rgt-q">II</th>}
                    {quarter >= 3 && <th className="rgt-q">III</th>}
                    {quarter >= 4 && <th className="rgt-q">IV</th>}
                    {(isPastYear() || quarter >= 4) && <th className="rgt-q">Год</th>}
                    {isPastYear() && <th className="rgt-q">Итог</th>}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => (
                    <tr key={subject}>
                      <td className="rgt-subject-cell">{subject}</td>
                      {quarter >= 1 && (
                        <td className="rgt-cell">
                          <input className="rgt-input" type="number" min={1} max={10}
                            value={gradeMap[subject]?.q1 ?? ''}
                            onChange={e => setGradeField(subject, 'q1', e.target.value)} />
                        </td>
                      )}
                      {quarter >= 2 && (
                        <td className="rgt-cell">
                          <input className="rgt-input" type="number" min={1} max={10}
                            value={gradeMap[subject]?.q2 ?? ''}
                            onChange={e => setGradeField(subject, 'q2', e.target.value)} />
                        </td>
                      )}
                      {quarter >= 3 && (
                        <td className="rgt-cell">
                          <input className="rgt-input" type="number" min={1} max={10}
                            value={gradeMap[subject]?.q3 ?? ''}
                            onChange={e => setGradeField(subject, 'q3', e.target.value)} />
                        </td>
                      )}
                      {quarter >= 4 && (
                        <td className="rgt-cell">
                          <input className="rgt-input" type="number" min={1} max={10}
                            value={gradeMap[subject]?.q4 ?? ''}
                            onChange={e => setGradeField(subject, 'q4', e.target.value)} />
                        </td>
                      )}
                      {(isPastYear() || quarter >= 4) && (
                        <td className="rgt-cell">
                          <input className="rgt-input" type="number" min={1} max={10}
                            value={gradeMap[subject]?.year ?? ''}
                            onChange={e => setGradeField(subject, 'year', e.target.value)} />
                        </td>
                      )}
                      {isPastYear() && (
                        <td className="rgt-cell">
                          <input className="rgt-input" type="number" min={1} max={10}
                            value={gradeMap[subject]?.final ?? ''}
                            onChange={e => setGradeField(subject, 'final', e.target.value)} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="step-nav">
              <button className="auth-btn btn-back" onClick={() => setStep(0)}>← Назад</button>
              <button className="auth-btn" onClick={() => setStep(2)}>Далее →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="auth-form">
            <p className="step-desc">
              Добавь результаты ЦЭ, ЦТ или РТ если уже сдавал(а). Можно пропустить.
            </p>
            {exams.map((exam, i) => (
              <div key={i} className="exam-row">
                <select className="field-input"
                  value={exam.examType}
                  onChange={e => setExams(p => p.map((x,j) => j===i ? {...x, examType: e.target.value} : x))}>
                  <option value="ЦЭ">ЦЭ</option>
                  <option value="ЦТ">ЦТ</option>
                  <option value="РТ">РТ</option>
                </select>
                <select className="field-input"
                  value={exam.subject}
                  onChange={e => setExams(p => p.map((x,j) => j===i ? {...x, subject: e.target.value} : x))}>
                  {EXAM_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="field-input" type="number"
                  min={0} max={100} value={exam.score} placeholder="Балл (0–100)"
                  onChange={e => setExams(p => p.map((x,j) => j===i ? {...x, score: e.target.value} : x))} />
                {exams.length > 1 && (
                  <button className="exam-remove-btn" onClick={() => removeExam(i)}>×</button>
                )}
              </div>
            ))}
            <button className="add-exam-btn" onClick={addExam}>+ Добавить ещё</button>
            <div className="step-nav">
              <button className="auth-btn btn-back" onClick={() => setStep(1)}>← Назад</button>
              <button className="auth-btn" onClick={() => setStep(3)}>Далее →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="auth-form">
            <p className="step-desc">
              Расскажи о себе — AI учтёт это при расчёте CRI. Все поля необязательные.
            </p>
            <div className="field">
              <label className="field-label">Увлечения и хобби</label>
              <input className="field-input" type="text" name="hobbies"
                value={form.hobbies} onChange={handleChange}
                placeholder="программирование, робототехника, шахматы..." />
            </div>
            <div className="field">
              <label className="field-label">Достижения (олимпиады, НПК, конкурсы)</label>
              <textarea className="field-input field-textarea" name="achievements"
                value={form.achievements} onChange={handleChange}
                placeholder="Призёр районной олимпиады по математике 2024..." rows={3} />
            </div>
            <div className="field">
              <label className="field-label">Школьная характеристика</label>
              <textarea className="field-input field-textarea" name="characteristic"
                value={form.characteristic} onChange={handleChange}
                placeholder="Активный, ответственный, интересуется точными науками..." rows={3} />
            </div>
            <div className="step-nav">
              <button className="auth-btn btn-back" onClick={() => setStep(2)}>← Назад</button>
              <button className="auth-btn" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Создаём профиль...' : '✦ Создать и рассчитать CRI'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
