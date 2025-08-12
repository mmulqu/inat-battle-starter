import React, { useEffect, useMemo, useState } from 'react';
import { fetchSprites, submitSprite, voteSprite, SpriteSubmission } from '../utils/api';

interface SpriteCurationPanelProps {
  scientificName: string;
  onClose: () => void;
}

export function SpriteCurationPanel({ scientificName, onClose }: SpriteCurationPanelProps) {
  const [submissions, setSubmissions] = useState<SpriteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [attribution, setAttribution] = useState('');
  const [submitter, setSubmitter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSprites(scientificName);
      setSubmissions(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [scientificName]);

  const handleVote = async (id: string, direction: 'up' | 'down') => {
    await voteSprite(id, direction);
    await load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setSubmitting(true);
    try {
      await submitSprite({ scientificName, imageUrl: imageUrl.trim(), attribution: attribution.trim() || undefined, submitter: submitter.trim() || undefined });
      setImageUrl('');
      setAttribution('');
      setSubmitter('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const top = useMemo(() => submissions[0], [submissions]);

  return (
    <div className="sprite-curation-backdrop" onClick={onClose}>
      <div className="sprite-curation-modal" onClick={e => e.stopPropagation()}>
        <div className="header">
          <h3>Sprites for {scientificName}</h3>
          <button onClick={onClose}>Close</button>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="content">
            <div className="top-preview">
              {top ? (
                <div className="card">
                  <img src={top.image_url} alt="top sprite" />
                  <div className="meta">
                    <span>Score: {top.score ?? 0} ({top.votes ?? 0} votes)</span>
                    {top.attribution && <span>Attribution: {top.attribution}</span>}
                  </div>
                </div>
              ) : (
                <div className="empty">No submissions yet. Be the first!</div>
              )}
            </div>

            <div className="list">
              {submissions.map(item => (
                <div key={item.id} className="list-item">
                  <img src={item.image_url} alt="submission" />
                  <div className="info">
                    <div className="score">Score: {item.score ?? 0}</div>
                    {item.attribution && <div className="attr">{item.attribution}</div>}
                    <div className="actions">
                      <button onClick={() => handleVote(item.id, 'up')}>Upvote</button>
                      <button onClick={() => handleVote(item.id, 'down')}>Downvote</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form className="submit" onSubmit={handleSubmit}>
              <h4>Submit a new sprite (image URL)</h4>
              <input type="url" placeholder="https://example.com/sprite.png" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required />
              <input type="text" placeholder="Attribution (author, license)" value={attribution} onChange={e => setAttribution(e.target.value)} />
              <input type="text" placeholder="Your name (optional)" value={submitter} onChange={e => setSubmitter(e.target.value)} />
              <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}