import type { APIRoute } from 'astro';
import { listWords } from '../../lib/firebase';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const words = await listWords();
    return new Response(JSON.stringify({ success: true, words }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch words',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
