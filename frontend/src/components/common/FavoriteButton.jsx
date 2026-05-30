export default function FavoriteButton({
  active = false,
  loading = false,
  onClick,
  title,
}) {
  return (
    <button
      type="button"
      className={`favorite-icon-button ${active ? "favorite-icon-button-active" : ""}`}
      onClick={onClick}
      disabled={loading}
      title={title}
    >
      {loading ? "..." : "★"}
    </button>
  );
}