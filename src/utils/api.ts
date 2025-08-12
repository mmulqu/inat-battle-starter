export interface SpriteSubmission {
  id: string;
  scientific_name: string;
  image_url: string;
  attribution?: string | null;
  submitter?: string | null;
  created_at: string;
  score?: number;
  votes?: number;
}

const API_BASE = '';

export async function fetchTopSprite(scientificName: string): Promise<SpriteSubmission | null> {
  const res = await fetch(`${API_BASE}/api/sprites/top?scientificName=${encodeURIComponent(scientificName)}`, { credentials: 'include' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch top sprite');
  return res.json();
}

export async function fetchSprites(scientificName: string): Promise<SpriteSubmission[]> {
  const res = await fetch(`${API_BASE}/api/sprites?scientificName=${encodeURIComponent(scientificName)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch sprites');
  return res.json();
}

export async function submitSprite(params: { scientificName: string; imageUrl: string; attribution?: string; submitter?: string; }) {
  const res = await fetch(`${API_BASE}/api/sprites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to submit sprite');
  return res.json();
}

export async function voteSprite(id: string, vote: 'up' | 'down') {
  const res = await fetch(`${API_BASE}/api/sprites/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ vote })
  });
  if (!res.ok) throw new Error('Failed to vote');
  return res.json();
}