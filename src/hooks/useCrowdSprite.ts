import { useEffect, useState } from 'react';
import { fetchTopSprite } from '../utils/api';

const cache = new Map<string, string | null>();

export function useCrowdSprite(scientificName: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!scientificName) {
      setUrl(null);
      return;
    }

    if (cache.has(scientificName)) {
      setUrl(cache.get(scientificName) ?? null);
      return;
    }

    fetchTopSprite(scientificName)
      .then(top => {
        const imageUrl = top?.image_url ?? null;
        cache.set(scientificName, imageUrl);
        if (!cancelled) setUrl(imageUrl);
      })
      .catch(() => {
        cache.set(scientificName, null);
        if (!cancelled) setUrl(null);
      });

    return () => { cancelled = true; };
  }, [scientificName]);

  return url;
}