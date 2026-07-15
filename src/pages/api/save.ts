import type { APIRoute } from 'astro';
import { saveWord } from '../../lib/firebase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      text = typeof body?.text === 'string' ? body.text : '';
    } else {
      const formData = await request.formData();
      text = formData.get('text')?.toString() || '';
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
