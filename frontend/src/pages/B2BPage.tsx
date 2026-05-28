import { useEffect, useState } from 'react';
import { b2bApi, Contract } from '../api/b2b.api';
import Layout from '../components/Layout';
import '../styles/b2b.css';

const statusLabel = (status: string) => {
  if (status === 'pending') return { text: 'На рассмотрении', color: 'var(--warning)' };
  if (status === 'approved') return { text: 'Одобрено', color: 'var(--success)' };
  if (status === 'rejected') return { text: 'Отклонено', color: 'var(--danger)' };
  return { text: status, color: 'var(--text-muted)' };
};

const industryIcon = (industry: string) => {
  if (industry.includes('IT')) return '💻';
  if (industry.includes('Медицина')) return '⚕️';
  if (industry.includes('Машиностроение')) return '⚙️';
  if (industry.includes('Металлургия')) return '🏭';
  return '🏢';
};

type Tab = 'all' | 'eligible' | 'my';

const ContractCard = ({ contract, onApply }: {
  contract: Contract;
  onApply: (contract: Contract) => void;
}) => {
  const slotsLeft = contract.slotsTotal - contract.slotsTaken;
  const deadline = new Date(contract.deadline).toLocaleDateString('ru-RU');

  return (
    <div className={`contract-card ${contract.isEligible ? 'contract-card--eligible' : 'contract-card--locked'}`}>
      <div className="contract-header">
        <div className="contract-company">
          <span className="company-icon">{industryIcon(contract.company.industry)}</span>
          <div>
            <div className="company-name">{contract.company.name}</div>
            <div className="company-industry">{contract.company.industry} · {contract.company.city}</div>
          </div>
        </div>
        <div className="contract-badges">
          {contract.isApplied && (
            <span className="badge-applied" style={{ color: statusLabel(contract.applicationStatus!).color }}>
              {statusLabel(contract.applicationStatus!).text}
            </span>
          )}
          {!contract.isEligible && !contract.isApplied && (
            <span className="badge-locked">Не подходит</span>
          )}
          {contract.isEligible && !contract.isApplied && (
            <span className="badge-eligible">Подходишь</span>
          )}
        </div>
      </div>

      <h3 className="contract-title">{contract.title}</h3>
      <div className="contract-meta">
        <span className="meta-item">🎓 {contract.university}</span>
        <span className="meta-item">📚 {contract.specialty}</span>
        <span className="meta-item">📅 до {deadline}</span>
        <span className={`meta-item ${slotsLeft <= 2 ? 'meta-item--urgent' : ''}`}>
          👥 {slotsLeft} из {contract.slotsTotal} мест
        </span>
      </div>

      <p className="contract-desc">{contract.description}</p>

      <div className="contract-details">
        <div className="detail-block">
          <div className="detail-title">Требования</div>
          <ul className="detail-list">
            {contract.requirements.map((r: string, i: number) => (
              <li key={i} className="detail-item detail-item--req">
                <span className="detail-check">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
        <div className="detail-block">
          <div className="detail-title">Преимущества</div>
          <ul className="detail-list">
            {contract.benefits.map((b: string, i: number) => (
              <li key={i} className="detail-item detail-item--ben">
                <span className="detail-check">✓</span>{b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!contract.isEligible && (
        <div className="contract-requirements-hint">
          <span>Нужно: CRI ≥ {contract.minCRI}% и средний балл ≥ {contract.minGrade}</span>
          <span>У тебя: CRI {contract.userCRI}% · балл {contract.userAvgGrade}</span>
        </div>
      )}

      {contract.isEligible && !contract.isApplied && slotsLeft > 0 && (
        <button className="btn-apply" onClick={() => onApply(contract)}>
          Подать заявку →
        </button>
      )}

      {slotsLeft === 0 && !contract.isApplied && (
        <div className="slots-full">Все места заняты</div>
      )}
    </div>
  );
};

const B2BPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [applying, setApplying] = useState<Contract | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    b2bApi.getContracts().then(({ contracts }) => {
      setContracts(contracts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleApply = async () => {
    if (!applying) return;
    setSubmitting(true);
    try {
      await b2bApi.apply(applying.id, message);
      setContracts(prev => prev.map(c =>
        c.id === applying.id
          ? { ...c, isApplied: true, applicationStatus: 'pending', slotsTaken: c.slotsTaken + 1 }
          : c
      ));
      setSuccess(true);
      setTimeout(() => {
        setApplying(null);
        setSuccess(false);
        setMessage('');
      }, 2000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Ошибка подачи заявки');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = contracts.filter(c => {
    if (tab === 'eligible') return c.isEligible && !c.isApplied;
    if (tab === 'my') return c.isApplied;
    return true;
  });

  const eligibleCount = contracts.filter(c => c.isEligible && !c.isApplied).length;
  const myCount = contracts.filter(c => c.isApplied).length;

  return (
    <Layout>
      <div className="b2b-page">
        <div className="b2b-header">
          <div>
            <h1 className="b2b-title">B2B Контракты</h1>
            <p className="b2b-sub">
              Целевые направления от предприятий Беларуси · {contracts.length} предложений
            </p>
          </div>
        </div>

        <div className="b2b-info-banner">
          <span className="banner-icon">ℹ️</span>
          <span>
            Целевое направление — предприятие оплачивает твоё обучение,
            ты работаешь у них 5 лет после окончания. Конкурс ниже чем на бюджет.
          </span>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'all' ? 'tab--active' : ''}`} onClick={() => setTab('all')}>
            Все предложения ({contracts.length})
          </button>
          <button className={`tab ${tab === 'eligible' ? 'tab--active' : ''}`} onClick={() => setTab('eligible')}>
            Подхожу ({eligibleCount})
          </button>
          <button className={`tab ${tab === 'my' ? 'tab--active' : ''}`} onClick={() => setTab('my')}>
            Мои заявки ({myCount})
          </button>
        </div>

        {loading && <div className="b2b-loading">Загружаем предложения...</div>}

        {!loading && filtered.length === 0 && (
          <div className="b2b-empty">
            {tab === 'my'
              ? 'Ты ещё не подавал заявки. Найди подходящее предложение!'
              : tab === 'eligible'
              ? 'Пока нет подходящих предложений. Повысь CRI и средний балл!'
              : 'Предложений пока нет.'}
          </div>
        )}

        <div className="contracts-list">
          {filtered.map(contract => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onApply={setApplying}
            />
          ))}
        </div>
      </div>

      {applying && (
        <div className="modal-overlay" onClick={() => !submitting && setApplying(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {success ? (
              <div className="modal-success">
                <div className="modal-success-icon">✓</div>
                <div className="modal-success-text">Заявка подана!</div>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Подать заявку</h3>
                  <button className="modal-close" onClick={() => setApplying(null)}>×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-company">{applying.company.name} — {applying.title}</p>
                  <div className="field">
                    <label className="field-label">Сопроводительное письмо (необязательно)</label>
                    <textarea
                      className="field-input field-textarea"
                      rows={4}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Расскажи почему хочешь работать в этой компании..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel-modal" onClick={() => setApplying(null)}>
                    Отмена
                  </button>
                  <button className="btn-submit" onClick={handleApply} disabled={submitting}>
                    {submitting ? 'Отправляем...' : 'Подать заявку'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default B2BPage;
