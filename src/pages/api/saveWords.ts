import type { APIRoute } from 'astro';
import type { SaveWordRequestBody, SaveWordResponse } from '../../lib/types';
import { saveWord } from '../../lib/firebase';

export const prerender = false; // Ensure server-side rendering for request access

// Helper to send JSON responses
const jsonResponse = (body: SaveWordResponse, status: number) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  let requestBody: SaveWordRequestBody | null = null;

  try {
    const contentType = request.headers.get('content-type')?.split(';')[0];
    if (contentType === 'application/json') {
      requestBody = await request.json();
    } else if (contentType === 'application/x-www-form-urlencoded') {
      const formData = await request.formData();
      requestBody = { text: String(formData.get('text') || '') };
    } else {
      // Fallback for other content types, attempt JSON parse or treat as raw text
      const rawText = await request.text();
      try {
        requestBody = JSON.parse(rawText);
      } catch {
        requestBody = { text: rawText };
      }
    }
  } catch (error) {
    console.error('[saveWords] Request body parsing failed:', error);
    return jsonResponse({
      success: false,
      message: 'Invalid request body format.',
    }, 400);
  }

  const text = typeof requestBody?.text === 'string' ? requestBody.text.trim() : '';

  if (!text) {
    return jsonResponse({
      success: false,
      message: 'Text is required',
    }, 400);
  }

  const words = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return jsonResponse({
      success: false,
      message: 'No valid words found',
    }, 400);
  }

  try {
    const results = await Promise.all(words.map((word) => saveWord(word)));
    return jsonResponse({
      success: true,
      results,
    }, 200);
  } catch (error) {
    console.error('[saveWords] Firebase save failed:', error);
    return jsonResponse({
      success: false,
      message: error instanceof Error ? error.message : 'Route failed',
    }, 500);
  }
};
