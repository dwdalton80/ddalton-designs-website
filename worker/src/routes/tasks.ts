/** Ports of createTask / updateTask / deleteTask. */

import * as db from '../lib/db';
import { json, badRequest } from '../lib/http';

export async function createTask(req: Request, env: Env, actor: string): Promise<Response> {
  const { title, project_name, estimated_hours, due_date, priority, notes } =
    (await req.json()) as Record<string, unknown>;

  if (!title) return badRequest('title is required');

  const task = await db.create(
    env.DB,
    'task',
    {
      title,
      project_name,
      estimated_hours,
      due_date,
      priority: priority || 'medium',
      notes,
      status: 'todo',
    },
    actor,
  );

  return json(task);
}

export async function updateTask(req: Request, env: Env): Promise<Response> {
  const { id, ...fields } = (await req.json()) as Record<string, unknown>;
  if (!id) return badRequest('Task ID is required');

  // Base44 passed the whole object through; undefined fields are dropped by
  // db.update so a partial payload doesn't null out untouched columns.
  const updated = await db.update(env.DB, 'task', String(id), {
    title: fields.title,
    project_name: fields.project_name,
    estimated_hours: fields.estimated_hours,
    actual_hours: fields.actual_hours,
    status: fields.status,
    due_date: fields.due_date,
    priority: fields.priority,
    notes: fields.notes,
  });

  return json(updated);
}

export async function deleteTask(req: Request, env: Env): Promise<Response> {
  const { id } = (await req.json()) as { id?: string };
  if (!id) return badRequest('Task ID is required');

  await db.remove(env.DB, 'task', id);
  return json({ success: true });
}
