import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const secretToken = Deno.env.get('FUNCTION_SECRET_TOKEN');
    const { token, functionName, payload } = await req.json();

    if (!secretToken || token !== secretToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!functionName || !payload) {
      return Response.json({ error: 'Missing functionName or payload' }, { status: 400 });
    }

    const result = await base44.asServiceRole.functions.invoke(functionName, {
      ...payload,
      token: secretToken,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});