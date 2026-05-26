export default function TeamLogo({
  name,
  shortName,
  logoUrl,
  size = "md",
}) {
  const initials =
    shortName?.slice(0, 3)?.toUpperCase() ||
    name?.slice(0, 3)?.toUpperCase() ||
    "TM";

  const sizeClass =
    size === "sm"
      ? "team-logo team-logo-sm"
      : size === "lg"
      ? "team-logo team-logo-lg"
      : "team-logo";

  if (logoUrl) {
    return (
      <div className={`${sizeClass} team-logo-image-wrap`}>
        <img
          src={logoUrl}
          alt={name || "Team logo"}
          className="team-logo-image"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.parentElement.classList.add("team-logo-fallback");
            event.currentTarget.parentElement.innerHTML = `<span>${initials}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} team-logo-fallback`}>
      <span>{initials}</span>
    </div>
  );
}