export default function StarRating({ value = 0, onChange, readOnly = false }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange?.(star)}
          style={{
            cursor: readOnly ? 'default' : 'pointer',
            color: star <= value ? '#FFD700' : '#ccc',
            fontSize: '24px'
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}