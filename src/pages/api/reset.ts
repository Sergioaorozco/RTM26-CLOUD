import type { APIRoute } from 'astro';
import { resetFirestore } from '../../lib/firebase';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const result = await resetFirestore();
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Reset failed',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
