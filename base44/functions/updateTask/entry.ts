import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id, title, project_name, estimated_hours, actual_hours, status, due_date, priority, notes } = await req.json();

    if (!id) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updatedTask = await base44.entities.Task.update(id, {
      title,
      project_name,
      estimated_hours,
      actual_hours,
      status,
      due_date,
      priority,
      notes
    });

    return Response.json(updatedTask);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});