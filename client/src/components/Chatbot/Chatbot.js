import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import { useAuth } from '../../contexts/AuthContext';
import './Chatbot.css';

const Chatbot = () => {
  const toast = useCustomToast();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Eventra's AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [quickSuggestions, setQuickSuggestions] = useState([
    'Show me upcoming events',
    'Help with booking',
    'Check my attendance',
    'Payment issues'
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch dynamic suggestions on component mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await api.get('/api/chatbot/suggestions');
        if (response.data.suggestions) {
          setQuickSuggestions(response.data.suggestions);
        }
      } catch (error) {
        // Keep default suggestions if API fails
      }
    };
    fetchSuggestions();
  }, []);

  const sendMessage = async (overrideText) => {
    const text = overrideText || inputValue;
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/chatbot/chat', { message: text });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: response.data.suggestions,
        category: response.data.category,
        confidence: response.data.confidence
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to get response from chatbot');

      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again or contact support.",
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['Try asking again', 'Contact support', 'Browse events', 'Check my bookings']
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="chatbot-fab"
        aria-label="Open chat assistant"
      >
        <img src="/eventra-logo.svg" alt="Eventra Assistant" className="h-7 w-7" />
      </motion.button>

      {/* Chatbot Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="chatbot-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0.05}
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="chatbot-window"
            >
              {/* Header */}
              <div className="chatbot-header">
                <div className="chatbot-header-info">
                  <div className="chatbot-avatar bg-white/20 p-1">
                    <img src="/eventra-logo.svg" alt="AI" className="h-full w-full" />
                  </div>
                  <div>
                    <h3 className="chatbot-title">Eventra Assistant</h3>
                    <p className="chatbot-subtitle">AI-powered support</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="chatbot-close-btn"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="chatbot-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chatbot-message-row ${message.sender === 'user' ? 'row-user' : 'row-bot'}`}
                  >
                    <div className={`chatbot-bubble-wrap ${message.sender === 'user' ? 'wrap-user' : 'wrap-bot'}`}>
                      <div className={`chatbot-avatar-sm overflow-hidden ${message.sender === 'user' ? 'avatar-user' : 'avatar-bot bg-white/10 p-1'}`}>
                        {message.sender === 'user'
                          ? (user?.profilePicture 
                              ? <img src={user.profilePicture} alt="You" className="h-full w-full object-cover" />
                              : <User className="h-4 w-4 text-white" />
                            )
                          : <img src="/eventra-logo.svg" alt="AI" className="h-full w-full" />
                        }
                      </div>
                      <div className={`chatbot-bubble ${message.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                        <p className="chatbot-text">{message.text}</p>

                        {message.sender === 'bot' && message.category && (
                          <div className="chatbot-meta">
                            <span className="chatbot-category">{message.category}</span>
                          </div>
                        )}

                        {message.suggestions && (
                          <div className="chatbot-suggestions">
                            {message.suggestions.slice(0, 3).map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => sendMessage(suggestion)}
                                className="chatbot-suggestion-btn"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="chatbot-message-row row-bot">
                    <div className="chatbot-bubble-wrap wrap-bot">
                      <div className="chatbot-avatar-sm avatar-bot bg-white/10 p-1">
                        <img src="/eventra-logo.svg" alt="AI" className="h-full w-full" />
                      </div>
                      <div className="chatbot-bubble bubble-bot">
                        <div className="chatbot-typing">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions */}
              {messages.length === 1 && (
                <div className="chatbot-quick-suggestions">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(suggestion)}
                      className="chatbot-quick-btn"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="chatbot-input-area">
                <div className="chatbot-input-wrap">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="chatbot-input"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="chatbot-send-btn"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
