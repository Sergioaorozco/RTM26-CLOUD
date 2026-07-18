import { useState, useEffect, useMemo } from 'react';

interface WordItem {
  text: string;
  count: number;
}

export default function WordCloud() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/words')
      .then(r => r.json())
      .then(data => {
        if (data.success) setWords(data.words);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxCount = useMemo(() => Math.max(...words.map(w => w.count), 1), [words]);
  const sorted = useMemo(() => [...words].sort((a, b) => b.count - a.count), [words]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-600">Aún no hay palabras registradas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-3 px-4 py-10">
        {sorted.map((w, i) => {
          const ratio = w.count / maxCount;
          const size = 0.75 + ratio * 2;
          const opacity = 0.5 + ratio * 0.5;
          const isSelected = selected === w.text;

          return (
            <span
              key={w.text}
              className={`cursor-pointer select-none transition-all duration-300 ${
                isSelected ? 'text-amber-300' : 'text-slate-400 hover:text-amber-400/80'
              }`}
              style={{
                fontSize: `${size}rem`,
                opacity: selected && !isSelected ? 0.15 : opacity,
                animation: `word-in 0.5s ease-out ${i * 0.04}s both`,
              }}
              onClick={() => setSelected(isSelected ? null : w.text)}
            >
              {w.text}
              {isSelected && (
                <span className="ml-1.5 inline-flex text-xs text-amber-500/70">
                  {w.count}
                </span>
              )}
            </span>
          );
        })}
      </div>

      <p className="text-xs text-slate-600">
        {sorted.length} palabra{sorted.length !== 1 ? 's' : ''}
        {' · '}toca para ver frecuencia
      </p>

      <style>{`
        @keyframes word-in {
          from { opacity: 0; transform: scale(0.7) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
