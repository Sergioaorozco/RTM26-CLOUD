const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID ?? '';
const apiKey = import.meta.env.PUBLIC_FIREBASE_API_KEY ?? '';
const db = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/%28default%29/documents`;

function fields(obj: Record<string, string | number>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'number' ? { integerValue: String(v) } : { stringValue: v };
  }
  return out;
}

async function get(col: string, id: string) {
  const res = await fetch(`${db}/${col}/${id}?key=${apiKey}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function create(col: string, data: Record<string, string | number>, docId?: string) {
  const qs = `?${docId ? `documentId=${docId}&` : ''}key=${apiKey}`;
  const res = await fetch(`${db}/${col}${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fields(data) }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function update(col: string, id: string, data: Record<string, string | number>) {
  const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const res = await fetch(`${db}/${col}/${id}?key=${apiKey}&currentDocument.exists=true&${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fields(data) }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveWord(text: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Please enter a word before sending.');
  if (!projectId) return { id: '', wordId: '' };

  const normalized = trimmed.toLowerCase();
  const now = new Date().toISOString();

  const existing = await get('words', normalized);

  if (existing) {
    const count = Number(existing.fields?.count?.integerValue ?? 0) + 1;
    await update('words', normalized, { count, lastSubmittedAt: now, latestValue: trimmed });
  } else {
    await create('words', { text: trimmed, normalizedText: normalized, count: 1, createdAt: now, lastSubmittedAt: now }, normalized);
  }

  const sub = await create('submissions', { text: trimmed, normalizedText: normalized, createdAt: now, source: 'rtm-cloud' });
  return { id: sub.name?.split('/').pop() ?? '', wordId: normalized };
}

export async function resetFirestore(): Promise<{ success: boolean; message: string }> {
  if (!projectId) return { success: false, message: 'No project ID' };

  const headers = { 'Content-Type': 'application/json' };

  async function deleteCollection(col: string) {
    const res = await fetch(`${db}/${col}?key=${apiKey}&pageSize=300`, { headers });
    if (!res.ok) return;
    const data = await res.json();
    const docs = data.documents ?? [];
    await Promise.all(docs.map((doc: { name: string }) => {
      const deleteUrl = new URL(`https://firestore.googleapis.com/v1/${doc.name}`);
      deleteUrl.searchParams.set('key', apiKey);
      return fetch(deleteUrl.toString(), { method: 'DELETE', headers });
    }));
    return docs.length;
  }

  const wordsDeleted = await deleteCollection('words') ?? 0;
  const subsDeleted = await deleteCollection('submissions') ?? 0;

  return { success: true, message: `Deleted ${wordsDeleted} words and ${subsDeleted} submissions` };
}

export async function listWords(): Promise<{ text: string; count: number }[]> {
  if (!projectId) return [];

  const res = await fetch(`${db}/words?key=${apiKey}`);
  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  const docs = data.documents ?? [];

  return docs.map((doc: Record<string, unknown>) => {
    const fields = doc.fields as Record<string, { stringValue?: string; integerValue?: string }>;
    return {
      text: fields?.text?.stringValue ?? doc.name?.split('/').pop() ?? '',
      count: Number(fields?.count?.integerValue ?? 0),
    };
  });
}
