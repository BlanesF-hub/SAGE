/* ============================================================
   WhatsAppInbox — Centro de Mensajería WhatsApp & Bot Asistente
   Permite atención a pacientes adultos, asistente virtual
   de respuestas automáticas y chat en vivo para el Médico.
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { turnoSupabaseApi } from '../services/api';
import {
  FiSend,
  FiUser,
  FiSearch,
  FiCalendar,
  FiCheckCircle,
  FiCpu,
  FiPhone,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './WhatsAppInbox.css';

interface Message {
  id: string;
  sender: 'PACIENTE' | 'BOT' | 'MEDICO';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  pacienteId?: number;
  nombre: string;
  telefono: string;
  unread: boolean;
  lastTime: string;
  messages: Message[];
}

export default function WhatsAppInbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('sage_wa_conversations');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [
      {
        id: 'conv-1',
        pacienteId: 1,
        nombre: 'Marta Gomez',
        telefono: '+54 9 261 459-8812',
        unread: true,
        lastTime: '13:14',
        messages: [
          {
            id: 'm1',
            sender: 'PACIENTE',
            text: 'Hola doctor, quisiera saber si tengo un turno esta semana.',
            timestamp: '13:10',
          },
          {
            id: 'm2',
            sender: 'BOT',
            text: '🤖 Hola Marta. Tu turno para Clínica General con el Dr. Juan Pérez está reservado para el Viernes 15/08 a las 09:30 hs. Respondé "SI" para confirmar tu asistencia.',
            timestamp: '13:10',
          },
          {
            id: 'm3',
            sender: 'PACIENTE',
            text: 'SI',
            timestamp: '13:14',
          },
          {
            id: 'm4',
            sender: 'BOT',
            text: '🤖 ¡Excelente! Tu turno ha sido CONFIRMADO. Te esperamos en el Consultorio Central.',
            timestamp: '13:14',
          },
        ],
      },
      {
        id: 'conv-2',
        pacienteId: 2,
        nombre: 'Juan Carlos Perez',
        telefono: '+54 9 261 512-3344',
        unread: false,
        lastTime: '11:45',
        messages: [
          {
            id: 'm2-1',
            sender: 'PACIENTE',
            text: 'Buenas tardes. ¿Cuáles son los requisitos para la primera consulta?',
            timestamp: '11:40',
          },
          {
            id: 'm2-2',
            sender: 'BOT',
            text: '🤖 Hola Juan Carlos. Para tu primera consulta, por favor presentá tu DNI y carnet de Obra Social si corresponde.',
            timestamp: '11:45',
          },
        ],
      },
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [botActive, setBotActive] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('sage_wa_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Enviar mensaje directo del Médico / Secretario al WhatsApp del Paciente
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const newMsg: Message = {
      id: 'm-' + Date.now(),
      sender: 'MEDICO',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            unread: false,
            lastTime: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText('');
    toast.success('Mensaje enviado al WhatsApp del paciente');
  };

  // Simular Mensaje Entrante de Paciente & Respuesta del Bot
  const handleSimulateIncomingMessage = (simulatedText?: string) => {
    if (!activeConv) return;
    const text = simulatedText || prompt('Ingrese el mensaje del paciente a simular:', 'Hola, necesito consultar mi turno');
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const patientMsg: Message = {
      id: 'm-' + Date.now(),
      sender: 'PACIENTE',
      text,
      timestamp: time,
    };

    let botResponseText = '';
    const lower = text.toLowerCase();

    if (botActive) {
      if (lower.includes('hola') || lower.includes('buenas')) {
        botResponseText = `🤖 Hola ${activeConv.nombre}! Bienvenido al asistente de SAGE Clínica Médica. Respondé:\n1. Consultar mis turnos\n2. Hablar con Secretaría/Médico`;
      } else if (lower === '1' || lower.includes('turno')) {
        botResponseText = `🤖 ${activeConv.nombre}, tenés 1 turno reservado en Clínica General. ¿Deseás confirmar? Respondé "SI".`;
      } else if (lower === 'si' || lower === 'sí' || lower.includes('confirm')) {
        botResponseText = `🤖 ¡Confirmado! Tu turno ha sido registrado como CONFIRMADO en nuestro sistema.`;
      } else if (lower === '2' || lower.includes('secretar')) {
        botResponseText = `🤖 Entendido. Derivé tu mensaje al médico/secretaría. Te responderán a la brevedad por este chat.`;
      } else {
        botResponseText = `🤖 Gracias por tu mensaje. Un profesional de la clínica lo revisará pronto.`;
      }
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          const nextMsgs = [...c.messages, patientMsg];
          if (botResponseText) {
            nextMsgs.push({
              id: 'm-bot-' + Date.now(),
              sender: 'BOT',
              text: botResponseText,
              timestamp: time,
            });
          }
          return {
            ...c,
            unread: false,
            lastTime: time,
            messages: nextMsgs,
          };
        }
        return c;
      })
    );

    toast.success('Mensaje entrante procesado');
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.includes(searchTerm)
  );

  const [chatbaseModalOpen, setChatbaseModalOpen] = useState(false);
  const [chatbaseBotId, setChatbaseBotId] = useState(() => localStorage.getItem('sage_chatbase_id') || '');
  const [showChatbaseIframe, setShowChatbaseIframe] = useState(false);

  const saveChatbaseConfig = () => {
    localStorage.setItem('sage_chatbase_id', chatbaseBotId.trim());
    toast.success('Configuración de Chatbase guardada');
    setChatbaseModalOpen(false);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#10b981' }}>💬</span> WhatsApp Inbox & Chatbase IA
          </h1>
          <p className="page-subtitle">
            Canal de comunicación para pacientes adultos. Asistente Chatbase.co y chat en directo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setChatbaseModalOpen(true)}
            style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
          >
            <FiCpu /> {chatbaseBotId ? 'Chatbase Conectado' : 'Conectar Chatbase.co'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleSimulateIncomingMessage()}
            title="Simular mensaje entrante de paciente"
          >
            <FiRefreshCw /> Simular Mensaje Paciente
          </button>
        </div>
      </div>

      <div className="wa-container">
        {/* Sidebar Left: Lista de Conversaciones */}
        <div className="wa-sidebar">
          <div className="wa-sidebar-header">
            <span className="wa-sidebar-title">
              <FiPhone style={{ color: '#10b981' }} /> Chats Activos
            </span>
            <span className="badge badge-primary">{conversations.length}</span>
          </div>

          <div className="wa-search-box">
            <input
              type="text"
              className="wa-search-input"
              placeholder="Buscar paciente o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ul className="wa-conv-list">
            {filteredConversations.map((c) => (
              <li
                key={c.id}
                className={`wa-conv-item ${c.id === activeConvId ? 'active' : ''}`}
                onClick={() => {
                  setActiveConvId(c.id);
                  setConversations((prev) =>
                    prev.map((item) => (item.id === c.id ? { ...item, unread: false } : item))
                  );
                }}
              >
                <div className="wa-avatar">{c.nombre.charAt(0)}</div>
                <div className="wa-conv-info">
                  <div className="wa-conv-top">
                    <span className="wa-conv-name">{c.nombre}</span>
                    <span className="wa-conv-time">{c.lastTime}</span>
                  </div>
                  <div className="wa-conv-lastmsg">
                    {c.messages[c.messages.length - 1]?.text || 'Sin mensajes'}
                  </div>
                </div>
                {c.unread && <span className="wa-badge-unread">Nuevo</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Area Right */}
        {activeConv ? (
          <div className="wa-chat-area">
            <div className="wa-chat-header">
              <div className="wa-chat-header-user">
                <div className="wa-avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                  {activeConv.nombre.charAt(0)}
                </div>
                <div>
                  <div className="wa-chat-header-name">{activeConv.nombre}</div>
                  <div className="wa-chat-header-sub">
                    <span>{activeConv.telefono}</span>
                  </div>
                </div>
              </div>

              <div className="wa-bot-toggle">
                <FiCpu style={{ color: botActive ? '#10b981' : '#94a3b8' }} />
                <span>Bot Automático: <strong>{botActive ? 'ACTIVO' : 'PAUSADO'}</strong></span>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() => setBotActive(!botActive)}
                  style={{ marginLeft: '8px' }}
                >
                  {botActive ? 'Pausar' : 'Activar'}
                </button>
              </div>
            </div>

            {/* Banner de Simulación Rápida */}
            <div className="wa-sim-bar">
              <span>💡 Modo Pruebas de Transición para Adultos:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() => handleSimulateIncomingMessage('Hola, quisiera ver mi turno')}
                >
                  Simular "Hola"
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() => handleSimulateIncomingMessage('SI')}
                >
                  Simular "SI" (Confirmar)
                </button>
              </div>
            </div>

            {/* Historial de Mensajes */}
            <div className="wa-messages-container">
              {activeConv.messages.map((m) => (
                <div
                  key={m.id}
                  className={`wa-msg-row ${
                    m.sender === 'PACIENTE' ? 'entrante' : m.sender === 'BOT' ? 'bot' : 'saliente'
                  }`}
                >
                  <div className="wa-bubble">
                    {m.text}
                  </div>
                  <div className="wa-msg-meta">
                    <span>{m.timestamp}</span>
                    {m.sender === 'MEDICO' && <FiCheckCircle style={{ color: '#60a5fa' }} />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form className="wa-input-bar" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="wa-input-text"
                placeholder={`Escribir respuesta directa a ${activeConv.nombre}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className="wa-btn-send" title="Enviar respuesta">
                <FiSend />
              </button>
            </form>
          </div>
        ) : (
          <div className="wa-chat-area" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ color: '#94a3b8' }}>Seleccioná un paciente para chatear</p>
          </div>
        )}
      </div>

      {/* Modal Conectar Chatbase */}
      {chatbaseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCpu style={{ color: '#818cf8' }} /> Integración Chatbase.co IA
              </h3>
              <button className="modal-close" onClick={() => setChatbaseModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Vincular el bot de <strong>Chatbase.co</strong> permite entrenar una Inteligencia Artificial con las reglas de tu clínica (horarios, médicos, especialidades) para responder en WhatsApp a pacientes de forma natural y automática.
              </p>

              <div className="input-group">
                <label htmlFor="cb-id">Chatbase Chatbot ID</label>
                <input
                  id="cb-id"
                  type="text"
                  className="input-field"
                  placeholder="Ej: v9AbXc12345"
                  value={chatbaseBotId}
                  onChange={(e) => setChatbaseBotId(e.target.value)}
                />
                <small style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                  Encontrás este ID en el panel de tu chatbot en <strong>Chatbase.co &gt; Settings &gt; Chatbot ID</strong>.
                </small>
              </div>

              {chatbaseBotId && (
                <div style={{ marginTop: '16px', background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <p style={{ fontSize: '0.82rem', color: '#a5b4fc', marginBottom: '8px', fontWeight: 600 }}>
                    💡 Vista Previa / Prueba del Bot de Chatbase:
                  </p>
                  <button
                    type="button"
                    className="btn btn-xs btn-secondary"
                    onClick={() => setShowChatbaseIframe(!showChatbaseIframe)}
                  >
                    {showChatbaseIframe ? 'Ocultar Chat' : 'Abrir Vista Previa de Chatbase'}
                  </button>

                  {showChatbaseIframe && (
                    <div style={{ marginTop: '12px', height: '350px', borderRadius: '8px', overflow: 'hidden' }}>
                      <iframe
                        src={`https://www.chatbase.co/chatbot-iframe/${chatbaseBotId}`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title="Chatbase Bot Preview"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setChatbaseModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveChatbaseConfig}>Guardar Configuración</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
