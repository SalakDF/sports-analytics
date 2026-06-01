import { createContext, useContext, useEffect, useMemo, useState } from "react";

const TIMEZONE_STORAGE_KEY = "sports.timezone";

const TIMEZONE_OPTIONS = [
  { value: "LOCAL", label: "Local" },
  { value: "Europe/Kiev", label: "Kyiv" },
  { value: "UTC", label: "UTC" },
];

const TimezoneContext = createContext(null);

export function TimezoneProvider({ children }) {
  const [timezone, setTimezone] = useState(() => {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    return TIMEZONE_OPTIONS.some((item) => item.value === stored) ? stored : "LOCAL";
  });

  useEffect(() => {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  }, [timezone]);

  const value = useMemo(
    () => ({
      timezone,
      setTimezone,
      options: TIMEZONE_OPTIONS,
    }),
    [timezone]
  );

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>;
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    throw new Error("useTimezone must be used inside TimezoneProvider");
  }
  return ctx;
}

