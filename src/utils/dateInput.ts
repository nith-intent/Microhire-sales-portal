export const DD_MM_YYYY_PLACEHOLDER = "dd-mm-yyyy";

const DD_MM_YYYY_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;

function daysInMonth(month1To12: number, year: number): number {
  return new Date(year, month1To12, 0).getDate();
}

export function parseDDMMYYYY(value: string): Date | null {
  const trimmed = value.trim();
  const match = trimmed.match(DD_MM_YYYY_REGEX);
  if (!match) return null;

  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const yyyy = Number(match[3]);

  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > daysInMonth(mm, yyyy)) return null;

  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
    return null;
  }
  return d;
}

export function toLocalISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateToDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
