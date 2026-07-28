import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const escapeCaption = (str) => String(str == null ? '' : str);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portfolio_item_id } = await req.json();

    if (!portfolio_item_id) {
      return Response.json({ error: 'Missing portfolio_item_id' }, { status: 400 });
    }

    // Re-fetch the record (trigger payloads may be omitted for large records)
    const item = await base44.asServiceRole.entities.PortfolioItem.get(portfolio_item_id);
    if (!item) {
      return Response.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    const imageUrl = item.cover_image || (Array.isArray(item.images) && item.images.length ? item.images[0] : null);
    if (!imageUrl) {
      return Response.json({ error: 'No image available to publish' }, { status: 400 });
    }

    // Instagram access token (shared connector — the builder's account)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // 1. Resolve the Instagram Business account id
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!meRes.ok) {
      const err = await meRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Failed to resolve Instagram account');
    }
    const me = await meRes.json();
    const igUserId = me.id;

    // 2. Build caption
    const lines = [];
    if (item.title) lines.push(escapeCaption(item.title));
    if (item.client_name) lines.push(`Client: ${escapeCaption(item.client_name)}`);
    lines.push('New work added to the DDalton Designs portfolio.');
    lines.push('#ddaltondesigns #designportfolio');
    if (item.category) lines.push(`#${String(item.category).replace(/\s+/g, '')}`);
    if (item.url) lines.push(`\nView live: ${escapeCaption(item.url)}`);
    const caption = lines.join('\n');

    // 3. Create the media container
    const createRes = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Failed to create media container');
    }
    const created = await createRes.json();
    const creationId = created.id;

    // 4. Publish the container
    const publishRes = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}/media_publish?creation_id=${encodeURIComponent(creationId)}&access_token=${encodeURIComponent(accessToken)}`,
      { method: 'POST' },
    );
    if (!publishRes.ok) {
      const err = await publishRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Failed to publish media');
    }
    const published = await publishRes.json();

    return Response.json({
      success: true,
      media_id: published.id,
      ig_user_id: igUserId,
      username: me.username,
    });
  } catch (error) {
    console.error('Instagram publish error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});