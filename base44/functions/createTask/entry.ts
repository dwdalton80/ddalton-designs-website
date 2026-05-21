import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { title, project_name, estimated_hours, due_date, priority, notes } = await req.json();

    const task = await base44.entities.Task.create({
      title,
      project_name,
      estimated_hours,
      due_date,
      priority: priority || 'medium',
      notes,
      status: 'todo'
    });

    return Response.json(task);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});