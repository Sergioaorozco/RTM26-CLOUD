import { useState, useEffect, useRef } from 'react';
import cloud from 'd3-cloud';

interface WordItem {
  text: string;
  count: number;
}

interface WordDatum {
  text: string;
  size: number;
  rotate: number;
}

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
}

const FONT_SERIF = '"Fraunces", Georgia, serif';
const FONT_SANS = '"DM Sans", sans-serif';

const COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#a8a29e', '#78716c', '#57534e'];

function getColor(ratio: number): string {
  if (ratio < 0.10) return COLORS[0];
  if (ratio < 0.25) return COLORS[1];
  if (ratio < 0.45) return COLORS[2];
  if (ratio < 0.65) return COLORS[3];
  if (ratio < 0.85) return COLORS[4];
  return COLORS[5];
}

export default function WordCloud() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [layout, setLayout] = useState<LayoutWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });

  useEffect(() => {
    fetch('/api/words')
      .then(r => r.json())
      .then(data => {
        if (data.success) setWords(data.words);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({ w: width, h: Math.min(width * 0.6, 500) });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (words.length === 0) return;

    const maxCount = Math.max(...words.map(w => w.count), 1);
    const entries: WordDatum[] = words.map(w => ({
      text: w.text,
      size: 12 + (w.count / maxCount) * 34,
      rotate: 0,
    }));

    const { w, h } = dimensions;
    const pad = 40;
    const innerW = Math.max(w - pad * 2, 100);
    const innerH = Math.max(h - pad * 2, 100);

    cloud<WordDatum>()
      .size([innerW, innerH])
      .words(entries)
      .padding(10)
      .rotate(0)
      .fontSize(d => d.size)
      .spiral('rectangular')
      .on('end', (computed: WordDatum[]) => {
        const sorted = [...words].sort((a, b) => b.count - a.count);
        const total = sorted.length;

        setLayout((computed as LayoutWord[]).map(word => {
          const sortedIdx = sorted.findIndex(w => w.text === word.text);
          const ratio = sortedIdx >= 0 ? sortedIdx / total : 1;
          return {
            ...word,
            x: word.x + w / 2,
            y: word.y + h / 2,
            fontFamily: ratio < 0.25 ? FONT_SERIF : FONT_SANS,
            fontWeight: ratio < 0.10 ? 700 : ratio < 0.30 ? 600 : ratio < 0.50 ? 500 : 300,
            color: getColor(ratio),
          };
        }));
      })
      .start();
  }, [words, dimensions]);

  const wordCounts = new Map(words.map(w => [w.text, w.count]));

  if (loading) {
    return (
      <div ref={containerRef} className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div ref={containerRef} className="py-20 text-center">
        <p className="text-sm text-slate-600">Aún no hay palabras registradas.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-4xl">
      <svg
        viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
        className="h-auto w-full"
        style={{ minHeight: `${dimensions.h}px` }}
      >
        {layout.map(word => {
          const isSelected = selected === word.text;
          const count = wordCounts.get(word.text) ?? 0;

          return (
            <text
              key={word.text}
              x={word.x}
              y={word.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={word.fontFamily}
              fontWeight={word.fontWeight}
              fontSize={word.size}
              fill={isSelected ? '#fbbf24' : word.color}
              className="cursor-pointer select-none transition-all duration-500"
              style={{
                opacity: selected && !isSelected ? 0.1 : 1,
                transition: 'fill 0.3s, opacity 0.4s',
              }}
              onMouseEnter={() => setSelected(word.text)}
              onMouseLeave={() => setSelected(null)}
            >
              <title>{count} {count === 1 ? 'vez' : 'veces'}</title>
              {word.text}
            </text>
          );
        })}
      </svg>

      <p className="mt-4 text-center text-xs text-slate-600">
        {words.length} palabra{words.length !== 1 ? 's' : ''}
        {' · '}pasa el cursor para ver frecuencia
      </p>
    </div>
  );
}
