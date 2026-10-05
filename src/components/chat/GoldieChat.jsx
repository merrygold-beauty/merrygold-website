// Goldie is the internal name of the assistant and its butterfly mark;
// visitors see it as Ask Olu (ASSISTANT_NAME).
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, Send, Calendar, CalendarCheck, MessageCircle, ArrowUpRight } from "lucide-react";
import { sendGoldieMessage } from "../../services/goldieChat";
import { clinicData, WHATSAPP_DISPLAY } from "../../data/clinic";
import { ASSISTANT_NAME } from "../../data/labels";
import { openConsultationForm } from "../../services/enquiries";
import useMediaQuery, { PHONE_QUERY } from "../../hooks/useMediaQuery";
import useSheetOpen from "../../hooks/useSheetOpen";
import useEscapeKey from "../../hooks/useEscapeKey";
import GoldieMark from "./GoldieMark";
import "./GoldieChat.css";

const QUICK_PROMPTS = [
  "Microblading consultation",
  "Laser hair removal prices",
  "Million Dollar Facial",
  "Book a treatment",
  "Opening hours & location"
];

const HINT_STORAGE_KEY = "merrygold_goldie_hint";
const WELCOME_MESSAGE = `Hi, welcome to ${ASSISTANT_NAME}. Ask me about treatments, prices or booking.`;

export default function GoldieChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: WELCOME_MESSAGE
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hintTimerRef = useRef(null);
  const isPhone = useMediaQuery(PHONE_QUERY);

  useSheetOpen(isOpen && isPhone);
  useEscapeKey(isOpen, () => setIsOpen(false));

  const handleSend = useCallback(async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isTyping) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInputVal("");
    setIsTyping(true);

    try {
      const response = await sendGoldieMessage(newMessages, text);
      setMessages([...newMessages, { role: "assistant", content: response.text }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `I am having trouble connecting right now. Please message us directly on WhatsApp (${WHATSAPP_DISPLAY}) or email ${clinicData.contact.email}.`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [inputVal, isTyping, messages]);

  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSendRef.current(e.detail.prompt);
      }
    };
    window.addEventListener("open-goldie-chat", handleOpenChat);
    return () => window.removeEventListener("open-goldie-chat", handleOpenChat);
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    clearTimeout(hintTimerRef.current);
    try {
      localStorage.setItem(HINT_STORAGE_KEY, "seen");
    } catch {
      // Private browsing or a blocked storage API: the hint just reappears
      // next visit, which is a fine fallback.
    }
  }, []);

  // One-time nudge, desktop only: shown 6 seconds after mount unless the
  // visitor has already seen it or opened the chat.
  useEffect(() => {
    if (isPhone) return undefined;
    let seen = false;
    try {
      seen = localStorage.getItem(HINT_STORAGE_KEY) === "seen";
    } catch {
      seen = false;
    }
    if (seen) return undefined;
    hintTimerRef.current = setTimeout(() => setShowHint(true), 6000);
    return () => clearTimeout(hintTimerRef.current);
  }, [isPhone]);

  useEffect(() => {
    if (!showHint) return undefined;
    const autoDismiss = setTimeout(dismissHint, 6000);
    return () => clearTimeout(autoDismiss);
  }, [showHint, dismissHint]);

  useEffect(() => {
    if (isOpen) dismissHint();
  }, [isOpen, dismissHint]);

  const formatMessage = (content) => {
    // Convert URLs into clickable links
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlPattern);

    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        const isWhatsApp = part.includes("wa.me");

        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="goldie-link-chip"
          >
            {isWhatsApp ? "Open WhatsApp Chat" : part}
            <ArrowUpRight size={12} />
          </a>
        );
      }
      return part;
    });
  };

  const panel = (
    // stopPropagation: on phones the panel sits inside a backdrop that closes on
    // click, and a phone keyboard's Enter key submits by clicking the Send button.
    <div
      className={`goldie-panel${isPhone ? " sheet" : ""}`}
      role="dialog"
      aria-label="Goldie AI Concierge"
      onClick={(e) => e.stopPropagation()}
    >
      {isPhone && <span className="sheet-handle" aria-hidden="true" />}

      {/* Header */}
      <div className="goldie-header">
        <div className="goldie-header-info">
          <div className="goldie-avatar">
            <GoldieMark size={28} />
          </div>
          <div className="goldie-title-row">
            <span className="goldie-name">{ASSISTANT_NAME}</span>
            <span className="goldie-status-dot" aria-hidden="true"></span>
          </div>
        </div>

        <button
          type="button"
          className="goldie-close-btn"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Body */}
      <div className="goldie-body">
        {messages.map((m, idx) => (
          <div key={idx} className={`goldie-msg ${m.role === "user" ? "msg-user" : "msg-bot"}`}>
            {m.role !== "user" && <GoldieMark size={22} className="msg-avatar" />}
            <div className="msg-bubble">{formatMessage(m.content)}</div>
          </div>
        ))}

        {isTyping && (
          <div className="goldie-msg msg-bot">
            <GoldieMark size={22} className="msg-avatar" />
            <div className="msg-bubble msg-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Question Chips */}
      <div className="goldie-chips-row">
        <Link
          to="/treatments"
          className="goldie-chip goldie-chip-link"
          onClick={() => setIsOpen(false)}
        >
          <Calendar size={13} />
          <span>Book a treatment</span>
        </Link>
        <button
          type="button"
          className="goldie-chip goldie-chip-link"
          onClick={() => {
            setIsOpen(false);
            openConsultationForm();
          }}
        >
          <CalendarCheck size={13} />
          <span>Free consultation</span>
        </button>
        <a
          href={clinicData.contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="goldie-chip btn-whatsapp"
        >
          <MessageCircle size={13} />
          <span>WhatsApp</span>
        </a>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            className="goldie-chip"
            onClick={() => handleSend(prompt)}
            disabled={isTyping}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        className="goldie-footer"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="goldie-input"
          placeholder="Ask about treatments, prices or booking"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isTyping}
        />
        <button
          type="submit"
          className="goldie-send-btn"
          disabled={!inputVal.trim() || isTyping}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );

  return (
    <div className="goldie-chat-wrapper">
      {showHint && (
        <div className="goldie-hint" onClick={dismissHint}>
          {WELCOME_MESSAGE}
        </div>
      )}

      <button
        type="button"
        className={`goldie-fab ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? `Close ${ASSISTANT_NAME} chat` : `Open ${ASSISTANT_NAME} chat`}
      >
        <span className="goldie-fab-icon goldie-fab-icon-mark">
          <GoldieMark size={26} />
        </span>
        <span className="goldie-fab-icon goldie-fab-icon-close">
          <X size={22} />
        </span>
        <span className="goldie-fab-dot" aria-hidden="true"></span>
        {/* Visible name above the butterfly; aria-hidden because the
            button's aria-label already carries it. */}
        <span className="goldie-fab-label" aria-hidden="true">{ASSISTANT_NAME}</span>
      </button>

      {isOpen && isPhone ? (
        <div className="goldie-backdrop sheet-backdrop" onClick={() => setIsOpen(false)}>
          {panel}
        </div>
      ) : (
        isOpen && panel
      )}
    </div>
  );
}
