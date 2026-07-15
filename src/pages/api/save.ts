import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    const rawBody = await request.text();

    console.log('content-type:', contentType);
    console.log('raw body:', rawBody);

    return new Response(JSON.stringify({ success: true, received: rawBody }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ success: false, message: 'Route failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
