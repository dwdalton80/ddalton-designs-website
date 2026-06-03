import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { estimateId } = await req.json();
    if (!estimateId) {
      return Response.json({ error: 'estimateId is required' }, { status: 400 });
    }

    const est = await base44.asServiceRole.entities.Estimate.get(estimateId);
    if (!est) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    if (est.client_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingClients = await base44.asServiceRole.entities.Client.filter({ email: est.client_email });
    let clientId = est.client_id;
    if (existingClients.length === 0) {
      const newClient = await base44.asServiceRole.entities.Client.create({
        name: est.client_name,
        email: est.client_email,
      });
      clientId = newClient.id;
    } else {
      clientId = existingClients[0].id;
    }

    await base44.asServiceRole.entities.Estimate.update(estimateId, { client_id: clientId, status: 'accepted' });

    const matchingRequests = await base44.asServiceRole.entities.ClientRequest.filter({ email: est.client_email });
    for (const r of matchingRequests) {
      if (r.status !== 'converted') {
        await base44.asServiceRole.entities.ClientRequest.update(r.id, { status: 'converted' });
      }
    }

    await base44.asServiceRole.entities.Invoice.create({
      estimate_id: estimateId,
      client_id: clientId,
      client_name: est.client_name,
      client_email: est.client_email,
      line_items: est.line_items,
      subtotal: est.subtotal,
      tax_rate: est.tax_rate,
      discount: est.discount,
      total: est.total,
      status: 'unpaid',
      paid_amount: 0,
      notes: est.notes,
    });

    try {
      await base44.functions.invoke('sendPortalInvite', {
        clientName: est.client_name,
        clientEmail: est.client_email,
      });
    } catch (_) {}

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});