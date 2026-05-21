import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchGradesThunk, fetchExamsThunk,
  upsertGradeThunk, deleteGradeThunk,
  createExamThunk, deleteExamThunk,
} from '../store/gradesSlice';
import { gradesApi } from '../api/grades.api';
import Layout from '../components/Layout';
import '../styles/grades.css';

const CURRENT_YEAR = new Date().getFullYear();
const EXAM_SUBJECTS = [
  'Математика','Физика','Химия','Биология','История Беларуси',
  'Всемирная история','Обществоведение','Английский язык',
  'Русский язык','Белорусский язык','Информатика','География',
];

type Tab = 'grades' | 'exams';

interface PopupState {
  subject: string;
  field: string;
  x: number;
  y: number;
  currentValue: number | string | null | undefined;
}

const SCORE_LABELS: Record<number, string> = {
  10: '10 — высший', 9: '9 — отлично', 8: '8 — хорошо',
  7: '7 — хорошо', 6: '6 — достаточно', 5: '5 — средне',
  4: '4 — ниже среднего', 3: '3 — низкий', 2: '2 — низкий', 1: '1 — низший',
};

const scoreClass = (score: number | null | undefined): string => {
  if (!score) return '';
  if (score >= 9) return 'cell--high';
  if (score >= 7) return 'cell--mid';
  if (score >= 5) return 'cell--low';
  return 'cell--fail';
};

const computeExpectedAvg = (grades: {
  quarter1?: number | null;
  quarter2?: number | null;
  quarter3?: number | null;
  quarter4?: number | null;
  yearScore?: number | null;
  finalScore?: number | null;
}[]): string => {
  const finals = grades
    .map(g => g.finalScore || g.yearScore)
    .filter((s): s is number => s !== null && s !== undefined && s > 0);
  if (finals.length === 0) {
    const quarters = grades.flatMap(g => [g.quarter1, g.quarter2, g.quarter3, g.quarter4]
      .filter((s): s is number => s !== null && s !== undefined && s > 0));
    if (quarters.length === 0) return '—';
    const raw = quarters.reduce((a, b) => a + b, 0) / quarters.length;
    return (Math.round(raw * 2) / 2).toFixed(1);
  }
  const raw = finals.reduce((a, b) => a + b, 0) / finals.length;
  return (Math.round(raw * 2) / 2).toFixed(1);
};

const GradesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { grades, examScores, isLoading } = useSelector((state: RootState) => state.grades);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('grades');
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [popupValue, setPopupValue] = useState<string>('');
  const [showExamForm, setShowExamForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [examForm, setExamForm] = useState({
    examType: 'ЦЭ', subject: 'Математика', score: '', year: CURRENT_YEAR,
  });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchGradesThunk());
    dispatch(fetchExamsThunk());
    gradesApi.getSubjects().then(({ subjects }) => setSubjects(subjects));
  }, [dispatch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getGrade = (subject: string) =>
    grades.find(g => g.subject === subject && g.year === CURRENT_YEAR);

  const openPopup = (e: React.MouseEvent, subject: string, field: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const grade = getGrade(subject);
    const val = grade ? (grade as unknown as Record<string, any>)[field] : undefined;
    setPopup({
      subject, field,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 4,
      currentValue: val as number | string | null | undefined,
    });
    setPopupValue(val !== null && val !== undefined ? String(val) : '');
  };

  const savePopup = async (value: string | number | null) => {
    if (!popup) return;
    setSaving(true);
    const { subject, field } = popup;
    const grade = getGrade(subject);
    const isExamScore = field === 'examScore';
    const numVal = !isExamScore && value !== '' && value !== null
      ? Number(value) : undefined;

    await dispatch(upsertGradeThunk({
      subject, year: CURRENT_YEAR,
      quarter1: grade?.quarter1 ?? undefined,
      quarter2: grade?.quarter2 ?? undefined,
      quarter3: grade?.quarter3 ?? undefined,
      quarter4: grade?.quarter4 ?? undefined,
      yearScore: grade?.yearScore ?? undefined,
      examScore: grade?.examScore ?? undefined,
      finalScore: grade?.finalScore ?? undefined,
      [field]: isExamScore ? (String(value) || undefined) : numVal,
    }));
    await dispatch(fetchGradesThunk());
    setSaving(false);
    setPopup(null);
  };

  const handleDeleteRow = async (subject: string) => {
    const grade = getGrade(subject);
    if (!grade) return;
    if (window.confirm(`Удалить все оценки по "${subject}"?`)) {
      await dispatch(deleteGradeThunk(grade.id));
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.score) return;
    await dispatch(createExamThunk({
      examType: examForm.examType, subject: examForm.subject,
      score: Number(examForm.score), year: Number(examForm.year),
    }));
    setShowExamForm(false);
    setExamForm({ examType: 'ЦЭ', subject: 'Математика', score: '', year: CURRENT_YEAR });
  };

  const avg = computeExpectedAvg(grades);
  const filledCount = subjects.filter(s => getGrade(s)).length;

  return (
    <Layout>
      <div className="grades-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Успеваемость</h1>
            <p className="page-sub">
              {user?.schoolGrade} класс · {CURRENT_YEAR} уч. год
              · средний балл: <strong>{avg}</strong>
              · внесено предметов: {filledCount} / {subjects.length}
            </p>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'grades' ? 'tab--active' : ''}`} onClick={() => setTab('grades')}>
            Журнал оценок
          </button>
          <button className={`tab ${tab === 'exams' ? 'tab--active' : ''}`} onClick={() => setTab('exams')}>
            ЦЭ / ЦТ / РТ
          </button>
        </div>

        {tab === 'grades' && (
          <div className="journal-wrap">
            <p className="journal-hint">
              Нажми на ячейку — появится панель выбора оценки. Экзаменационное изложение вводится через дробь (8/7).
              Средний балл считается по внесённым итоговым оценкам с округлением 0.5 в пользу ученика.
            </p>
            <div className="journal-scroll">
              <table className="journal-table">
                <thead>
                  <tr>
                    <th className="th-num">№</th>
                    <th className="th-subject">Предмет</th>
                    <th className="th-q">I</th>
                    <th className="th-q">II</th>
                    <th className="th-q">III</th>
                    <th className="th-q">IV</th>
                    <th className="th-q">Год</th>
                    <th className="th-exam">Экз.</th>
                    <th className="th-final">Итог</th>
                    <th className="th-del"></th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, idx) => {
                    const grade = getGrade(subject);
                    const renderCell = (field: string, value: number | string | null | undefined) => {
                      const isExam = field === 'examScore';
                      const numVal = typeof value === 'number' ? value : null;
                      return (
                        <td
                          key={field}
                          className={`td-cell ${numVal ? scoreClass(numVal) : 'td-empty'} ${popup?.subject === subject && popup?.field === field ? 'td-active' : ''}`}
                          onClick={(e) => openPopup(e, subject, field)}
                        >
                          {isExam ? (value || '') : (value ?? '')}
                        </td>
                      );
                    };

                    return (
                      <tr key={subject} className={grade ? 'tr-has-data' : ''}>
                        <td className="td-num">{idx + 1}</td>
                        <td className="td-subject">{subject}</td>
                        {renderCell('quarter1', grade?.quarter1)}
                        {renderCell('quarter2', grade?.quarter2)}
                        {renderCell('quarter3', grade?.quarter3)}
                        {renderCell('quarter4', grade?.quarter4)}
                        {renderCell('yearScore', grade?.yearScore)}
                        {renderCell('examScore', grade?.examScore)}
                        {renderCell('finalScore', grade?.finalScore)}
                        <td className="td-del">
                          {grade && (
                            <button className="del-btn" onClick={() => handleDeleteRow(subject)} title="Удалить строку">×</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {isLoading && <p className="loading-hint">Загрузка...</p>}
          </div>
        )}

        {tab === 'exams' && (
          <div className="exams-section">
            <div className="exams-header">
              <p className="journal-hint">
                ЦЭ, ЦТ и РТ учитываются при расчёте CRI и рекомендациях AI-навигатора.
                РТ (республиканское тестирование) проводится в марте-апреле — полезно для практики.
              </p>
              <button className="btn-add" onClick={() => setShowExamForm(!showExamForm)}>
                {showExamForm ? 'Отмена' : '+ Добавить результат'}
              </button>
            </div>

            {showExamForm && (
              <form onSubmit={handleAddExam} className="exam-form">
                <select className="form-select" value={examForm.examType}
                  onChange={e => setExamForm(p => ({ ...p, examType: e.target.value }))}>
                  <option value="ЦЭ">ЦЭ</option>
                  <option value="ЦТ">ЦТ</option>
                  <option value="РТ">РТ</option>
                </select>
                <select className="form-select" value={examForm.subject}
                  onChange={e => setExamForm(p => ({ ...p, subject: e.target.value }))}>
                  {EXAM_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="form-select" type="number" min={0} max={100}
                  value={examForm.score} placeholder="Балл (0–100)" required
                  onChange={e => setExamForm(p => ({ ...p, score: e.target.value }))} />
                <select className="form-select" value={examForm.year}
                  onChange={e => setExamForm(p => ({ ...p, year: Number(e.target.value) }))}>
                  {[CURRENT_YEAR, CURRENT_YEAR - 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button type="submit" className="btn-add">Сохранить</button>
              </form>
            )}

            {examScores.length === 0 ? (
              <div className="empty-state">
                <p>Результатов пока нет.</p>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                  Внеси баллы ЦЭ, ЦТ или РТ — AI учтёт их при расчёте CRI.
                </p>
              </div>
            ) : (
              <div className="journal-scroll">
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th className="th-subject" style={{ textAlign: 'left', paddingLeft: 16 }}>Тип</th>
                      <th className="th-subject" style={{ textAlign: 'left' }}>Предмет</th>
                      <th className="th-q">Балл</th>
                      <th className="th-q">Год</th>
                      <th className="th-del"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {examScores.map(exam => (
                      <tr key={exam.id} className="tr-has-data">
                        <td className="td-subject">
                          <span className={`exam-badge ${exam.examType === 'ЦЭ' ? 'badge--ce' : exam.examType === 'РТ' ? 'badge--rt' : 'badge--ct'}`}>
                            {exam.examType}
                          </span>
                        </td>
                        <td className="td-subject">{exam.subject}</td>
                        <td className={`td-cell ${exam.score >= 70 ? 'cell--high' : exam.score >= 50 ? 'cell--mid' : 'cell--fail'}`}>
                          {exam.score}
                        </td>
                        <td className="td-subject" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{exam.year}</td>
                        <td className="td-del">
                          <button className="del-btn" onClick={() => dispatch(deleteExamThunk(exam.id))}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {popup && (
        <div
          ref={popupRef}
          className="score-popup"
          style={{ left: popup.x, top: popup.y }}
        >
          {popup.field === 'examScore' ? (
            <div className="popup-exam-input">
              <p className="popup-title">Экзаменационная оценка</p>
              <p className="popup-sub">Изложение: через дробь (8/7)</p>
              <input
                className="popup-text-input"
                value={popupValue}
                onChange={e => setPopupValue(e.target.value)}
                placeholder="8 или 8/7"
                autoFocus
              />
              <div className="popup-actions">
                <button className="popup-save" onClick={() => savePopup(popupValue)} disabled={saving}>
                  {saving ? '...' : 'Сохранить'}
                </button>
                <button className="popup-clear" onClick={() => savePopup(null)}>Очистить</button>
              </div>
            </div>
          ) : (
            <div className="popup-scores">
              <p className="popup-title">
                {popup.subject} · {
                  popup.field === 'quarter1' ? 'I четверть' :
                  popup.field === 'quarter2' ? 'II четверть' :
                  popup.field === 'quarter3' ? 'III четверть' :
                  popup.field === 'quarter4' ? 'IV четверть' :
                  popup.field === 'yearScore' ? 'Годовая' : 'Итоговая'
                }
              </p>
              <div className="popup-grid">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(score => (
                  <button
                    key={score}
                    className={`popup-score-btn score-btn--${score >= 9 ? 'high' : score >= 7 ? 'mid' : score >= 5 ? 'low' : 'fail'} ${Number(popup.currentValue) === score ? 'popup-score-btn--active' : ''}`}
                    onClick={() => savePopup(score)}
                    disabled={saving}
                    title={SCORE_LABELS[score]}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <button className="popup-clear" onClick={() => savePopup(null)}>Очистить ячейку</button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default GradesPage;
