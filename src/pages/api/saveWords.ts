import type { APIRoute } from 'astro';
import type { SaveWordRequestBody, SaveWordResponse } from '../../lib/types';
import { saveWord } from '../../lib/firebase';

async function parseRequestBody(request: Request): Promise<SaveWordRequestBody | null> {
  const contentType = request.headers.get('content-type')?.split(';')[0] ?? '';

  console.log('[saveWords] content-type:', request.headers.get('content-type'));

  if (contentType === 'application/json') {
    const json = await request.json().catch((error) => {
      console.error('[saveWords] JSON parse failed:', error);
      return null;
    });
    console.log('[saveWords] parsed JSON body:', json);
    return json;
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    const formData = await request.formData();
    return { text: String(formData.get('text') || '') };
  }

  const raw = await request.text();
  try {
    return JSON.parse(raw);
  } catch {
    return { text: raw };
  }
}

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  const body = await parseRequestBody(request);
  console.log('Parsed body:', body);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  console.log('Extracted text:', text);

  if (!text) {
    const responseBody: SaveWordResponse = {
      success: false,
      message: 'Text is required',
      body,
    };
    return new Response(JSON.stringify(responseBody), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const words = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) {
    const responseBody: SaveWordResponse = {
      success: false,
      message: 'No valid words found',
      body,
    };
    return new Response(JSON.stringify(responseBody), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const results = await Promise.all(words.map((word) => saveWord(word)));
    const responseBody: SaveWordResponse = {
      success: true,
      results,
    };
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const responseBody: SaveWordResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Route failed',
    };
    return new Response(JSON.stringify(responseBody), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
