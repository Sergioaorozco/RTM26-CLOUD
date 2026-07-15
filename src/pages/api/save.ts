import type { APIRoute } from 'astro';
import { saveWord } from '../../lib/firebase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      text = formData.get('text')?.toString() || '';
    } else {
      const rawBody = await request.text();

      if (contentType.includes('application/json') && rawBody) {
        try {
          const parsed = JSON.parse(rawBody);
          text = typeof parsed?.text === 'string' ? parsed.text : '';
        } catch {
          text = '';
        }
      } else if (rawBody) {
        const params = new URLSearchParams(rawBody);
        text = params.get('text') || '';
      }
    }

    if (!text.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'La palabra está vacía.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await saveWord(text);

    return new Response(JSON.stringify({ success: true, id: result.id, wordId: result.wordId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar.';
    console.error('saveWord failed:', message);

    return new Response(JSON.stringify({ success: false, message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
