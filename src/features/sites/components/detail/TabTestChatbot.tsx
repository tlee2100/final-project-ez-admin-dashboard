'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendOutlined, UndoOutlined, CheckSquareOutlined, BorderOutlined } from '@ant-design/icons';
import type { SiteDetailInfo } from '../../mock/sitesDetailMockData';

interface TabTestChatbotProps {
  stats: SiteDetailInfo;
}

interface MessageItem {
  id: string;
  sender: 'bot' | 'visitor';
  text: string;
  timestamp: string;
}

export function TabTestChatbot({ stats }: TabTestChatbotProps) {
  const [messages, setMessages] = useState<MessageItem[]>(() => [
    {
      id: 'msg-start',
      sender: 'bot',
      text: `Hi there! I'm ChatBot, your AI assistant. How can I help you with ${stats.conversations[0]?.visitorName ? 'our' : 'this'} products or services today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [selectedKB, setSelectedKB] = useState<string[]>(() =>
    stats.kbDocuments.map((doc) => doc.name),
  );
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleKBChange = (fileName: string) => {
    setSelectedKB((prev) =>
      prev.includes(fileName) ? prev.filter((name) => name !== fileName) : [...prev, fileName],
    );
  };

  const getBotResponse = useCallback((text: string, currentKB: string[]): string => {
    if (currentKB.length === 0) {
      return "I don't have access to any knowledge base documents right now to answer that query. Please enable at least one document in the testing controls.";
    }

    const query = text.toLowerCase();

    // Check query keywords
    if (query.includes('pricing') || query.includes('plans') || query.includes('cost')) {
      if (!currentKB.includes('Pricing Information.pdf')) {
        return "I see you're asking about pricing, but the 'Pricing Information.pdf' document is currently disabled in my active context.";
      }
      return 'Our plans start at $29/month for the Starter package, $79/month for Growth, and custom packages for Enterprise needs. All plans include standard dashboard analytics.';
    }

    if (query.includes('password') || query.includes('reset') || query.includes('login')) {
      if (!currentKB.includes('User Manual.docx')) {
        return "Resetting passwords is covered in the 'User Manual.docx', which is currently disabled in my context.";
      }
      return "To reset your password, visit the login screen, click 'Forgot Password', enter your email, and follow the secure link sent to your inbox.";
    }

    if (query.includes('api') || query.includes('developer') || query.includes('integrate')) {
      if (!currentKB.includes('API Documentation.md')) {
        return "Detailed API specs are outlined in 'API Documentation.md', which is currently disabled.";
      }
      return 'You can use our Javascript widget SDK. Just include the embed script before the closing </body> tag, initializing with your site ID.';
    }

    if (query.includes('feature') || query.includes('spec') || query.includes('what can you do')) {
      if (!currentKB.includes('Product Specifications.pdf')) {
        return "Product features are detailed in 'Product Specifications.pdf', which is currently disabled.";
      }
      return 'I support natural language processing, active live chat takeover, customized salon templates, and logical site metrics grouping.';
    }

    if (query.includes('help') || query.includes('support')) {
      if (!currentKB.includes('FAQ.html')) {
        return "FAQs are detailed in 'FAQ.html', which is currently disabled.";
      }
      return 'For billing issues, email support@ezchatbot.io. For general widget questions, check out our inline testing simulator.';
    }

    return "That's a great question! Based on my available knowledge base files, I can verify that topic is supported. Let me know how you'd like to proceed.";
  }, []);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const userMsg: MessageItem = {
        id: `msg-user-${Date.now()}`,
        sender: 'visitor',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputVal('');
      setIsTyping(true);

      // Simulate network lag + typing indicators
      setTimeout(() => {
        setIsTyping(false);
        const botMsg: MessageItem = {
          id: `msg-bot-${Date.now()}`,
          sender: 'bot',
          text: getBotResponse(text, selectedKB),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }, 1000);
    },
    [selectedKB, getBotResponse],
  );

  const handleResetConversation = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: `Conversation reset. Hi! How can I help you with ${stats.conversations[0]?.visitorName ? 'our' : 'this'} products or services today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="test-chatbot-container">
      {/* ── Left Pane: Active Chat Window ── */}
      <div className="test-chat-pane">
        <div className="test-chat-header">
          <div className="test-chat-header-info">
            <span className="test-chat-title">Test Your Chatbot</span>
            <span className="test-chat-badge active">Live Testing</span>
          </div>
          <button className="test-chat-reset-btn" onClick={handleResetConversation}>
            <UndoOutlined /> Reset Conversation
          </button>
        </div>

        {/* Message Feed */}
        <div className="test-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
              <div className="chat-message-bubble">
                <p className="chat-message-text">{msg.text}</p>
                <span className="chat-message-time">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message-row bot typing">
              <div className="chat-message-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          className="test-chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
        >
          <input
            type="text"
            className="test-chat-input"
            placeholder="Type your message..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isTyping}
            maxLength={200}
            autoComplete="off"
          />
          <button
            type="submit"
            className="test-chat-send-btn"
            disabled={!inputVal.trim() || isTyping}
          >
            <SendOutlined />
          </button>
        </form>
      </div>

      {/* ── Right Pane: Side Panel Testing Controls ── */}
      <div className="test-controls-pane">
        <h3 className="test-pane-title">Testing Controls</h3>

        {/* Section: KB Documents Selectors */}
        <div className="test-control-section">
          <h4 className="test-section-subtitle">Knowledge Base</h4>
          <p className="test-section-desc">
            Select specific KB documents to test how the chatbot responds with limited context.
          </p>
          <div className="test-kb-list">
            {stats.kbDocuments.map((doc) => {
              const isChecked = selectedKB.includes(doc.name);
              return (
                <button
                  key={doc.name}
                  className={`test-kb-item ${isChecked ? 'selected' : ''}`}
                  onClick={() => handleKBChange(doc.name)}
                  aria-label={`Toggle document ${doc.name}`}
                >
                  <span className="test-kb-icon">
                    {isChecked ? <CheckSquareOutlined /> : <BorderOutlined />}
                  </span>
                  <div className="test-kb-info">
                    <span className="test-kb-name">{doc.name}</span>
                    <span className="test-kb-meta">
                      {doc.type} • {doc.size}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Sample Questions List */}
        <div className="test-control-section">
          <h4 className="test-section-subtitle">Sample Questions</h4>
          <p className="test-section-desc">
            Try these sample questions to test your chatbot&apos;s responses.
          </p>
          <div className="test-questions-list">
            {stats.sampleQuestions.map((q) => (
              <button
                key={q}
                className="test-question-card"
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
              >
                <span className="test-question-card-text">{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
