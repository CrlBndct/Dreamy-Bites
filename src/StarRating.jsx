import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= shown ? 'star filled' : 'star'}
          disabled={readOnly}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}