import * as React from 'react';
import { useState, type KeyboardEvent } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { saveWords } from '../lib/api';
import { X, Sparkles, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InputChip() {
  const [chips, setChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val) {
        // Prevent duplicate chips
        if (!chips.includes(val)) {
          setChips([...chips, val]);
        }
        setInputValue('');
        setStatus('idle');
        setMessage('');
      }
    } else if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      // Remove the last chip if backspace is pressed on empty input
      setChips(chips.slice(0, -1));
    }
  };

  const removeChip = (indexToRemove: number) => {
    setChips(chips.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chips.length === 0) return;

    setStatus('loading');
    setMessage('');

    try {
      const textToSend = chips.join(' ');
      const response = await saveWords(textToSend);
      if (response.success) {
        setStatus('success');
        setMessage(response.message || '¡Tus pensamientos han sido guardados con éxito!');
        setChips([]); // Clear chips on success
      } else {
        setStatus('error');
        setMessage(response.message || 'Hubo un problema al guardar.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error de conexión.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-inner shadow-black/30 backdrop-blur-sm transition-all focus-within:border-amber-400/50 focus-within:ring-2 focus-within:ring-amber-400/20">
          
          {/* Chips container */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/5 max-h-28 overflow-y-auto">
              {chips.map((chip, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-amber-400/10 text-amber-200 border border-amber-400/20 px-2 py-0.5 rounded-md flex items-center gap-1 text-sm transition-all hover:bg-amber-400/20 animate-in fade-in zoom-in-95 duration-150"
                >
                  <span>{chip}</span>
                  <button
                    type="button"
                    onClick={() => removeChip(index)}
                    className="hover:bg-amber-400/20 rounded-full p-0.5 transition-colors text-amber-300 hover:text-white outline-none"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Input & Button inline container */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chips.length === 0 ? "¿Qué piensas? (Escribe y presiona Enter o coma)" : "Añade otro pensamiento..."}
              className="h-10 border-0 bg-transparent px-2 text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 md:text-base"
            />
            <Button
              type="submit"
              disabled={chips.length === 0 || status === 'loading'}
              className="h-10 shrink-0 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold px-4 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-amber-400 flex items-center gap-1.5 shadow-md shadow-amber-950/20"
            >
              {status === 'loading' ? (
                <div className="size-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Enviar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Feedback messages */}
      {status === 'success' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{message}</span>
        </div>
      )}

      {chips.length > 0 && status === 'idle' && (
        <p className="px-2 text-xs text-amber-200/50 flex items-center gap-1">
          <Sparkles className="size-3 text-amber-400/70" />
          <span>Presiona Enter para agregar el texto actual como una palabra clave.</span>
        </p>
      )}
    </div>
  );
}
