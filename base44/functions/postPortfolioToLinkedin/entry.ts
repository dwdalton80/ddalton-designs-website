import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Discover the "DDalton Designs" LinkedIn organization the builder administers.
async function getOrganizationUrn(accessToken) {
  const res = await fetch(
    'https://api.linkedin.com/v2/organizationAcls?q=role&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organization~(localizedName,vanityName)))',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Failed to list LinkedIn organizations');
  }
  const data = await res.json();
  const elements = Array.isArray(data.elements) ? data.elements : [];
  const match = elements.find((el) => {
    const name = (el?.['organization~']?.['localizedName'] || '').toLowerCase().trim();
    const vanity = (el?.['organization~']?.['vanityName'] || '').toLowerCase().trim();
    return name === 'ddalton designs' || vanity === 'ddaltondesigns';
  });
  const orgUrn = match?.['organization'];
  const orgName = match?.['organization~']?.['localizedName'] || 'DDalton Designs';
  if (!orgUrn) {
    const found =
      elements
        .map((el) => el?.['organization~']?.['localizedName'])
        .filter(Boolean)
        .join(', ') || 'none';
    throw new Error(
      `No LinkedIn company page named "DDalton Designs" was found for this account (administered pages: ${found}). Only the DDalton Designs page is allowed.`,
    );
  }
  return { orgUrn, orgName };
}

// Register an image upload, push the bytes, and wait for the asset to become READY.
async function uploadImageAsset(accessToken, orgUrn, imageUrl) {
  const regRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: orgUrn,
        serviceRelationships: [
          { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
        ],
      },
    }),
  });
  if (!regRes.ok) {
    const err = await regRes.json().catch(() => ({}));
    throw new Error(err?.message || 'Failed to register image upload');
  }
  const reg = await regRes.json();
  const assetUrn = reg?.value?.asset;
  const uploadUrl =
    reg?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  if (!assetUrn || !uploadUrl) {
    throw new Error('LinkedIn did not return an upload URL');
  }

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to download portfolio image (${imgRes.status})`);
  }
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
  const imgBuf = await imgRes.arrayBuffer();
  const upRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': contentType },
    body: imgBuf,
  });
  if (!upRes.ok) {
    throw new Error(`Image upload failed (${upRes.status})`);
  }

  // Poll until the asset is READY (LinkedIn processes uploads asynchronously)
  const assetId = assetUrn.split(':').pop();
  for (let i = 0; i < 8; i++) {
    await sleep(1500);
    const stRes = await fetch(`https://api.linkedin.com/v2/assets/${assetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (stRes.ok) {
      const st = await stRes.json();
      const recipes = st?.recipes || [];
      const ready = recipes.some((r) => r.status === 'READY' || r.status === 'ALLOWED');
      if (ready) return assetUrn;
    }
  }
  // Even if we cannot confirm READY, return the asset URN — LinkedIn will attach when ready
  return assetUrn;
}

function buildCaption(item) {
  const lines = [];
  if (item.title) lines.push(String(item.title));
  lines.push('New work added to the DDalton Designs portfolio.');
  if (item.client_name) lines.push(`Client: ${item.client_name}`);
  if (item.category) lines.push(`Category: ${item.category}`);
  lines.push('See the full portfolio at https://ddaltondesigns.com/portfolio');
  if (item.url) lines.push(`View the live project: ${item.url}`);
  lines.push('#ddaltondesigns #designportfolio #design');
  return lines.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portfolio_item_id } = await req.json();

    if (!portfolio_item_id) {
      return Response.json({ error: 'Missing portfolio_item_id' }, { status: 400 });
    }

    const item = await base44.asServiceRole.entities.PortfolioItem.get(portfolio_item_id);
    if (!item) {
      return Response.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    const imageUrl =
      item.cover_image || (Array.isArray(item.images) && item.images.length ? item.images[0] : null);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    const { orgUrn, orgName } = await getOrganizationUrn(accessToken);
    const caption = buildCaption(item);

    let media = [];
    if (imageUrl) {
      try {
        const assetUrn = await uploadImageAsset(accessToken, orgUrn, imageUrl);
        media = [
          {
            status: 'READY',
            media: assetUrn,
            title: { text: String(item.title || 'New Portfolio Item').slice(0, 120) },
            description: { text: String(item.description || caption).slice(0, 400) },
          },
        ];
      } catch (err) {
        // Fall back to a text-only post if the image upload fails
        console.error('Image upload failed, posting text only:', err.message);
      }
    }

    const shareContent = {
      shareCommentary: { text: caption },
      shareMediaCategory: media.length ? 'IMAGE' : 'NONE',
    };
    if (media.length) shareContent.media = media;

    const ugcRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: orgUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: { 'com.linkedin.ugc.ShareContent': shareContent },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });
    if (!ugcRes.ok) {
      const err = await ugcRes.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to publish LinkedIn post');
    }
    const published = await ugcRes.json();
    const postId = published.id || ugcRes.headers.get('x-restli-id') || '';

    return Response.json({
      success: true,
      post_id: postId,
      organization: orgName,
      has_image: media.length > 0,
    });
  } catch (error) {
    console.error('LinkedIn publish error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});