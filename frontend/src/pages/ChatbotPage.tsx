import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { aiApi } from '../api/ai.api';
import { ChatMessage } from '../types';
import Layout from '../components/Layout';
import '../styles/chatbot.css';

const SUGGESTIONS = [
  'Какие вузы лучше для IT?',
  'Что такое ЦЭ и ЦТ?',
  'Как поступить в БГУИР?',
  'Что такое целевое направление?',
  'Расскажи про Национальный детский технопарк',
];

const ChatbotPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    aiApi.getHistory().then(({ history }) => {
      setMessages(history);
      setHistoryLoaded(true);
    }).catch(() => setHistoryLoaded(true));
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
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const { answer } = await aiApi.ask(text.trim());
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        createdAt: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Произошла ошибка. Попробуй ещё раз.',
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatContent = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

  return (
    <Layout>
      <div className="chat-page">
        <div className="chat-header">
          <div>
            <h1 className="page-title">AI-Навигатор</h1>
            <p className="page-sub">Вузы Беларуси · ЦЭ · ЦТ · Карьера</p>
          </div>
          <span className="online-badge">● Онлайн</span>
        </div>

        <div className="chat-body">
          {historyLoaded && messages.length === 0 && (
            <div className="chat-empty">
              <p className="chat-empty-title">
                Привет, {user?.firstName}
              </p>
              <p className="chat-empty-sub">
                Задай вопрос про поступление, вузы или карьеру в Беларуси.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="suggestion-btn"
                    onClick={() => sendMessage(s)}
                    disabled={isLoading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`message message--${msg.role}`}
            >
              {msg.role === 'assistant' && (
                <div className="msg-avatar">Б</div>
              )}
              <div
                className="msg-bubble"
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              />
              {msg.role === 'user' && (
                <div className="msg-avatar msg-avatar--user">
                  {user?.firstName?.[0] || '?'}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="message message--assistant">
              <div className="msg-avatar">Б</div>
              <div className="msg-bubble msg-bubble--loading">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задай вопрос... (Enter — отправить, Shift+Enter — перенос)"
            rows={1}
            disabled={isLoading}
            maxLength={1000}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ChatbotPage;
