const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID ?? '';
const apiKey = import.meta.env.PUBLIC_FIREBASE_API_KEY ?? '';

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

function toFields(obj: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    }
  }
  return fields;
}

async function getDoc(collection: string, docId: string) {
  const url = `${BASE_URL}/${collection}/${encodeURIComponent(docId)}?key=${apiKey}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET failed: ${await res.text()}`);
  return res.json();
}

async function createDoc(collection: string, docId: string, data: Record<string, unknown>) {
  const url = `${BASE_URL}/${collection}?documentId=${encodeURIComponent(docId)}&key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore create failed: ${await res.text()}`);
  return res.json();
}

async function updateDoc(collection: string, docId: string, data: Record<string, unknown>, incrementField?: string) {
  const url = `${BASE_URL}/${collection}/${encodeURIComponent(docId)}?key=${apiKey}&currentDocument.exists=true`;
  const body: Record<string, unknown> = {
    fields: toFields(data),
  };
  if (incrementField) {
    body.transforms = [{
      fieldTransforms: [{
        fieldPath: incrementField,
        increment: { integerValue: '1' },
      }],
    }];
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore update failed: ${await res.text()}`);
  return res.json();
}

async function addDoc(collection: string, data: Record<string, unknown>) {
  const url = `${BASE_URL}/${collection}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore add failed: ${await res.text()}`);
  return res.json();
}

export async function saveWord(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Please enter a word before sending.');
  }

  if (!projectId) {
    return { id: '', wordId: '' };
  }

  const normalized = trimmed.toLowerCase();
  const now = new Date().toISOString();

  const existing = await getDoc('words', normalized);

  if (existing) {
    await updateDoc('words', normalized, {
      lastSubmittedAt: now,
      latestValue: trimmed,
    }, 'count');
  } else {
    await createDoc('words', normalized, {
      text: trimmed,
      normalizedText: normalized,
      count: 1,
      createdAt: now,
      lastSubmittedAt: now,
    });
  }

  const submission = await addDoc('submissions', {
    text: trimmed,
    normalizedText: normalized,
    createdAt: now,
    source: 'rtm-cloud',
  });

  const id = submission.name?.split('/').pop() ?? '';
  return { id, wordId: normalized };
}
