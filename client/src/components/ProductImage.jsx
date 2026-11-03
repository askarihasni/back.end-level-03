import { useEffect, useState } from 'react';

const FALLBACK_IMAGE = '/images/fallback.svg';

export default function ProductImage({ src, alt, className = '', loading = 'lazy' }) {
  const [source, setSource] = useState(src || FALLBACK_IMAGE);

  useEffect(() => {
    setSource(src || FALLBACK_IMAGE);
  }, [src]);

  return (
    <img
      src={source}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (source !== FALLBACK_IMAGE) setSource(FALLBACK_IMAGE);
      }}
    />
  );
}
