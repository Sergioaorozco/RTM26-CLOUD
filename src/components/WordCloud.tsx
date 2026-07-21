import { useState, useEffect, useRef } from 'react';
import cloud from 'd3-cloud';

interface WordItem {
  text: string;
  count: number;
}

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
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
    const entries = words.map(w => ({
      text: w.text,
      size: 12 + (w.count / maxCount) * 34,
    }));

    const { w, h } = dimensions;
    const pad = 40;
    const innerW = Math.max(w - pad * 2, 100);
    const innerH = Math.max(h - pad * 2, 100);

    cloud()
      .size([innerW, innerH])
      .words(entries)
      .padding(2)
      .rotate(0)
      .font('inherit')
      .fontSize(d => (d as typeof entries[number]).size)
      .spiral('rectangular')
      .on('end', (computed: LayoutWord[]) => {
        console.log(`[WordCloud] placed ${computed.length}/${entries.length} words`);
        setLayout(computed.map(word => ({ ...word, x: word.x + w / 2, y: word.y + h / 2 })));
      })
      .start();
  }, [words, dimensions]);

  const maxCount = Math.max(...words.map(w => w.count), 1);

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
          const ratio = word.size / (14 + 40);
          const opacity = 0.45 + ratio * 0.55;

          return (
            <text
              key={word.text}
              transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="inherit"
              fontSize={word.size}
              fill={isSelected ? '#fbbf24' : `rgba(148, 163, 184, ${opacity})`}
              className="cursor-pointer select-none transition-all duration-300 font-bold"
              style={{
                opacity: selected && !isSelected ? 0.1 : 1,
                transition: 'fill 0.3s, opacity 0.3s',
              }}
              onMouseEnter={() => setSelected(word.text)}
              onMouseLeave={() => setSelected(null)}
            >
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
