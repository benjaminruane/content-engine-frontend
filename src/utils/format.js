// src/utils/format.js
//
// Helpers for consistent numeric formatting across the app.
// - formatNumber: always uses standard English commas
// - formatYear: ensures plain YYYY for year-like values

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || value === "") return "";

  // Strip existing commas if the value is a string
  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(num)) {
    // Fallback: just return the original value as a string
    return String(value);
  }

  const { minimumFractionDigits, maximumFractionDigits } = options;

  const formatter = new Intl.NumberFormat("en-US", {
    useGrouping: true,
    minimumFractionDigits:
      typeof minimumFractionDigits === "number" ? minimumFractionDigits : 0,
    maximumFractionDigits:
      typeof maximumFractionDigits === "number"
        ? maximumFractionDigits
        : Number.isInteger(num)
        ? 0
        : 2,
  });

  return formatter.format(num);
}

// When you *know* the value is a year, use this.
// It guarantees YYYY (no thousand separators) for reasonable year ranges.
export function formatYear(value) {
  if (value === null || value === undefined || value === "") return "";

  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(num)) {
    return String(value);
  }

  if (num >= 1900 && num <= 2100) {
    return String(num);
  }

  // If it's not a plausible year, fall back to generic formatting
  return formatNumber(num);
}
