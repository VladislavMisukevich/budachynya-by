import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { aiApi } from '../api/ai.api';
import { ChatMessage } from '../types';

const SUGGESTIONS = [
  'Какие вузы Беларуси лучше для IT?',
  'Что такое ЦЭ и ЦТ?',
  'Как поступить в БГУИР?',
  'Что такое целевое направление?',
  'Какие олимпиады дают преимущества при поступлении?',
  'Что такое Национальный детский технопарк?',
];

const ChatbotPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { history } = await aiApi.getHistory();
        setMessages(history);
      } catch {
        console.error('Ошибка загрузки истории');
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { answer } = await aiApi.ask(text.trim());
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извини, произошла ошибка. Попробуй ещё раз.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.navBack}>← Назад</Link>
        <span style={styles.navTitle}>Будучыня.BY</span>
        <span style={styles.navUser}>{user?.firstName}</span>
      </nav>

      <div style={styles.container}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.aiAvatar}>🤖</div>
            <div>
              <h3 style={styles.aiName}>AI-Навигатор</h3>
              <p style={styles.aiStatus}>● Онлайн</p>
            </div>
          </div>

          <p style={styles.sidebarDesc}>
            Я помогу тебе выбрать профессию и найти путь в лучшие вузы Беларуси.
          </p>

          <div style={styles.suggestionsBlock}>
            <p style={styles.suggestionsTitle}>Попробуй спросить:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                style={styles.suggestionBtn}
                onClick={() => sendMessage(s)}
                disabled={isLoading}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.chatArea}>
          <div style={styles.messages}>
            {isLoadingHistory && (
              <div style={styles.loadingHistory}>Загружаем историю...</div>
            )}

            {!isLoadingHistory && messages.length === 0 && (
              <div style={styles.emptyChat}>
                <div style={styles.emptyChatIcon}>🎓</div>
                <h3 style={styles.emptyChatTitle}>
                  Привет, {user?.firstName}!
                </h3>
                <p style={styles.emptyChatDesc}>
                  Я знаю всё о вузах Беларуси, ЦЭ, ЦТ и карьерных возможностях.
                  Задай свой первый вопрос!
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={styles.assistantAvatar}>🤖</div>
                )}
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(msg.role === 'user'
                      ? styles.userBubble
                      : styles.assistantBubble),
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatText(msg.content),
                  }}
                />
                {msg.role === 'user' && (
                  <div style={styles.userAvatar}>
                    {user?.firstName?.[0] || '?'}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <div style={styles.assistantAvatar}>🤖</div>
                <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                  <div style={styles.typing}>
                    <span style={styles.dot} />
                    <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                    <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Задай вопрос AI-навигатору..."
              disabled={isLoading}
              maxLength={1000}
            />
            <button
              type="submit"
              style={{
                ...styles.sendBtn,
                opacity: isLoading || !input.trim() ? 0.5 : 1,
              }}
              disabled={isLoading || !input.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f5f7fa',
  },
  nav: {
    background: '#0f3460',
    padding: '0 32px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  navBack: { color: '#fff', textDecoration: 'none', fontSize: '14px' },
  navTitle: { color: '#fff', fontWeight: '700', fontSize: '18px' },
  navUser: { color: 'rgba(255,255,255,0.7)', fontSize: '14px' },
  container: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    maxWidth: '1100px',
    width: '100%',
    margin: '0 auto',
    padding: '20px',
    gap: '20px',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflowY: 'auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  aiAvatar: {
    fontSize: '36px',
    width: '52px',
    height: '52px',
    background: '#f0f4ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiName: { margin: '0 0 2px', fontSize: '16px', fontWeight: '600', color: '#1a1a2e' },
  aiStatus: { margin: 0, fontSize: '12px', color: '#16a34a' },
  sidebarDesc: {
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
  },
  suggestionsBlock: { display: 'flex', flexDirection: 'column', gap: '8px' },
  suggestionsTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  suggestionBtn: {
    background: '#f8f9ff',
    border: '1px solid #e8eaff',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#0f3460',
    cursor: 'pointer',
    textAlign: 'left',
    lineHeight: '1.4',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  loadingHistory: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    padding: '20px',
  },
  emptyChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
  },
  emptyChatIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyChatTitle: { fontSize: '22px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 8px' },
  emptyChatDesc: { fontSize: '15px', color: '#666', lineHeight: '1.6', maxWidth: '400px' },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  assistantAvatar: {
    width: '32px',
    height: '32px',
    background: '#f0f4ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    background: '#0f3460',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  userBubble: {
    background: '#0f3460',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: '#f8f9ff',
    color: '#1a1a2e',
    borderBottomLeftRadius: '4px',
    border: '1px solid #e8eaff',
  },
  typing: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    padding: '4px 0',
  },
  dot: {
    width: '8px',
    height: '8px',
    background: '#0f3460',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'bounce 1.2s ease-in-out infinite',
  },
  inputArea: {
    padding: '16px 24px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    background: '#f8f9fa',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    background: '#0f3460',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};

export default ChatbotPage;
