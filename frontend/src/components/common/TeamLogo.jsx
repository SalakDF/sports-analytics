import { useMemo, useState } from "react";

export default function TeamLogo({
  name,
  shortName,
  logoUrl,
  size = "md",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = useMemo(() => {
    const source = shortName?.trim() || name?.trim() || "?";

    if (!source) return "?";

    const words = source.split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }, [name, shortName]);

  const sizeClass =
    size === "sm"
      ? "team-logo team-logo-sm"
      : size === "lg"
      ? "team-logo team-logo-lg"
      : "team-logo";

  const shouldShowImage =
    Boolean(logoUrl) &&
    typeof logoUrl === "string" &&
    logoUrl.trim() !== "" &&
    !imageFailed;

  return (
    <div className={`${sizeClass} team-logo-shell`}>
      {shouldShowImage ? (
        <img
          src={logoUrl}
          alt={name || "Team logo"}
          className="team-logo-image"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="team-logo-fallback">{initials}</span>
      )}
    </div>
  );
}