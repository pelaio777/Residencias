import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Mensaje {
  sender: 'bot' | 'user';
  text: string;
}

export const ChatbotAsistente: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { sender: 'bot', text: '¡Hola! Soy tu asistente inteligente. Pregúntame lo que quieras sobre cómo usar el sistema de ortopedia.' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, loading, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const textoUsuario = input.trim();
    const nuevosMensajes: Mensaje[] = [...mensajes, { sender: 'user', text: textoUsuario }];
    setMensajes(nuevosMensajes);
    setInput('');
    setLoading(true);

    try {
      // Petición a tu backend que se conecta con la IA enviando mensaje e historial
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: textoUsuario,
          historial: mensajes.map(m => ({ sender: m.sender, text: m.text }))
        }),
      });

      const data = await response.json();

      if (response.ok && data.respuesta) {
        setMensajes(prev => [...prev, { sender: 'bot', text: data.respuesta }]);
      } else {
        setMensajes(prev => [...prev, { sender: 'bot', text: data.error || 'Lo siento, ocurrió un error al procesar tu pregunta.' }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensajes(prev => [...prev, { sender: 'bot', text: 'No me pude conectar con el servidor de inteligencia artificial.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#5ba4c7] hover:bg-[#4a8fb0] text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          title="Asistente Inteligente"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col h-[480px] overflow-hidden">
          <div className="bg-[#5ba4c7] px-5 py-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm">Asistente IA</h3>
                <p className="text-[10px] text-white/80">Pregúntame lo que necesites</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {mensajes.map((msg, index) => (
              <div key={index} className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${msg.sender === 'user' ? 'bg-[#2f8caf] text-white' : 'bg-[#5ba4c7] text-white'
                  }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.sender === 'user'
                    ? 'bg-[#5ba4c7] text-white rounded-tr-none'
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none whitespace-pre-wrap'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-gray-400 text-xs p-2">
                <Loader2 size={16} className="animate-spin" /> Analizando tu duda...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 bg-gray-100 px-4 py-2.5 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#5ba4c7] hover:bg-[#4a8fb0] disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};