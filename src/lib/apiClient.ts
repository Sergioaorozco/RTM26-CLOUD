import type { SaveWordResponse } from './types';

const API_BASE_URL = '/api/saveWords';

export async function saveWords(text: string): Promise<SaveWordResponse> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as SaveWordResponse;
}