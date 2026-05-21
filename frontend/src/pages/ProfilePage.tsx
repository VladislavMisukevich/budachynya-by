import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { getMeThunk } from '../store/authSlice';
import { authApi } from '../api/auth.api';
import { aiApi } from '../api/ai.api';
import Layout from '../components/Layout';
import '../styles/profile.css';

const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState({
    hobbies: '', achievements: '', characteristic: '', city: '',
  });
  const [original, setOriginal] = useState({ ...form });
  const [saving, setSaving] = useState(false);
  const [recalcState, setRecalcState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [recalcResult, setRecalcResult] = useState<{ newCRI: number; changed: boolean; reason: string } | null>(null);
  const [savedCRI, setSavedCRI] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) dispatch(getMeThunk());
    aiApi.loadCRI().then(({ cri }) => setSavedCRI(cri)).catch(() => {});
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      const vals = {
        hobbies: user.hobbies || '',
        achievements: user.achievements || '',
        characteristic: user.characteristic || '',
        city: user.city || '',
      };
      setForm(vals);
      setOriginal(vals);
    }
  }, [user]);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(original);

  const getChangesText = () => {
    const parts: string[] = [];
    if (form.hobbies !== original.hobbies)
      parts.push(`Увлечения: было "${original.hobbies || 'не указано'}", стало "${form.hobbies}"`);
    if (form.achievements !== original.achievements)
      parts.push(`Достижения: было "${original.achievements || 'не указано'}", стало "${form.achievements}"`);
    if (form.characteristic !== original.characteristic)
      parts.push(`Характеристика: было "${original.characteristic || 'не указано'}", стало "${form.characteristic}"`);
    if (form.city !== original.city)
      parts.push(`Город: было "${original.city || 'не указан'}", стало "${form.city}"`);
    return parts.join('\n');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      setOriginal({ ...form });
      setSaveSuccess(true);
      dispatch(getMeThunk());
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRecalc = async () => {
    if (!hasChanges && original === form) return;
    setRecalcState('loading');
    setRecalcResult(null);
    try {
      const changes = getChangesText();
      const result = await aiApi.recalcCRI(changes);
      setRecalcResult(result);
      if (result.changed) setSavedCRI(result.newCRI);
    } catch {
      setRecalcResult({ newCRI: savedCRI ?? 0, changed: false, reason: 'Ошибка соединения' });
    } finally {
      setRecalcState('done');
    }
  };

  const criColor = (cri: number) =>
    cri >= 80 ? 'var(--success)' : cri >= 60 ? 'var(--accent)' : cri >= 40 ? 'var(--warning)' : 'var(--danger)';

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-header">
          <div>
            <h1 className="profile-title">Профиль</h1>
            <p className="profile-sub">{user?.firstName} {user?.lastName} · {user?.schoolGrade} класс</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-main">
            <div className="profile-section">
              <h2 className="profile-section-title">Личная информация</h2>

              <div className="field">
                <label className="field-label">Город</label>
                <input className="field-input" type="text"
                  value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Минск" />
              </div>

              <div className="field">
                <label className="field-label">Увлечения и хобби</label>
                <input className="field-input" type="text"
                  value={form.hobbies} onChange={e => setForm(p => ({ ...p, hobbies: e.target.value }))}
                  placeholder="программирование, робототехника, шахматы..." />
              </div>

              <div className="field">
                <label className="field-label">Достижения (олимпиады, НПК, конкурсы)</label>
                <textarea className="field-input field-textarea" rows={4}
                  value={form.achievements} onChange={e => setForm(p => ({ ...p, achievements: e.target.value }))}
                  placeholder="Призёр районной олимпиады по математике 2024..." />
              </div>

              <div className="field">
                <label className="field-label">Школьная характеристика</label>
                <textarea className="field-input field-textarea" rows={4}
                  value={form.characteristic} onChange={e => setForm(p => ({ ...p, characteristic: e.target.value }))}
                  placeholder="Активный, ответственный, интересуется точными науками..." />
              </div>

              <div className="profile-actions">
                {hasChanges && (
                  <p className="changes-hint">
                    ● Есть несохранённые изменения
                  </p>
                )}
                {saveSuccess && (
                  <p className="save-success">✓ Сохранено</p>
                )}
                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? 'Сохраняем...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          </div>

          <div className="profile-side">
            <div className="cri-card">
              <h3 className="cri-card-title">Индекс готовности</h3>

              {savedCRI !== null ? (
                <div className="cri-display">
                  <div className="cri-big-num" style={{ color: criColor(savedCRI) }}>
                    {savedCRI}%
                  </div>
                  <div className="cri-big-label">
                    {savedCRI >= 80 ? 'Отличная готовность' :
                     savedCRI >= 60 ? 'Хорошая готовность' :
                     savedCRI >= 40 ? 'Средняя готовность' : 'Нужно подтянуть'}
                  </div>
                </div>
              ) : (
                <div className="cri-empty">CRI не рассчитан</div>
              )}

              <div className="cri-divider" />

              <p className="cri-recalc-hint">
                {!hasChanges
                  ? 'Измени данные профиля чтобы пересчитать CRI'
                  : 'Сохрани изменения и пересчитай CRI'}
              </p>

              <button
                className="btn-recalc"
                onClick={handleRecalc}
                disabled={!hasChanges || recalcState === 'loading'}
              >
                {recalcState === 'loading' ? '⏳ AI анализирует...' : '✦ Пересчитать CRI'}
              </button>

              {recalcResult && recalcState === 'done' && (
                <div className={`recalc-result ${recalcResult.changed ? 'recalc-result--changed' : 'recalc-result--same'}`}>
                  <div className="recalc-result-title">
                    {recalcResult.changed
                      ? `CRI изменился: ${recalcResult.newCRI}%`
                      : 'CRI не изменился'}
                  </div>
                  <div className="recalc-result-reason">{recalcResult.reason}</div>
                </div>
              )}

              <div className="cri-info-block">
                <p className="cri-info-row">
                  <span>Email</span>
                  <span>{user?.email}</span>
                </p>
                <p className="cri-info-row">
                  <span>Класс</span>
                  <span>{user?.schoolGrade}</span>
                </p>
                <p className="cri-info-row">
                  <span>Аккаунт создан</span>
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
