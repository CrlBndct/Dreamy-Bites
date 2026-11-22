export default function StarRating({ value = 0, onChange, readOnly = false }) {
  return (
    <div className="star-rating" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          aria-pressed={value === star}
          onClick={() => onChange?.(star)}
          style={{
            cursor: readOnly ? 'default' : 'pointer',
            color: star <= value ? '#FFD700' : '#ccc',
            fontSize: '24px',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}