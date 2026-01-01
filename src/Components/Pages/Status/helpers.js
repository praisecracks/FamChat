export function getExpiresMs(status) {
  if (!status) return null;

  // Prefer explicit expiresAt
  if (status.expiresAt) {
    try {
      if (typeof status.expiresAt.toMillis === "function") return status.expiresAt.toMillis();
      if (status.expiresAt instanceof Date) return status.expiresAt.getTime();
      if (typeof status.expiresAt === "number") return status.expiresAt;
    } catch (e) {
      return null;
    }
  }

  // Fallback to timestamp + 24h
  if (status.timestamp) {
    try {
      if (typeof status.timestamp.toMillis === "function") return status.timestamp.toMillis() + 24 * 60 * 60 * 1000;
      if (typeof status.timestamp === "number") return status.timestamp + 24 * 60 * 60 * 1000;
      if (status.timestamp instanceof Date) return status.timestamp.getTime() + 24 * 60 * 60 * 1000;
    } catch (e) {
      return null;
    }
  }

  return null;
}

export function formatRemainingLabel(expiresMs) {
  if (!expiresMs) return "";
  const delta = expiresMs - Date.now();
  if (delta <= 0) return "Expired";

  const seconds = Math.floor(delta / 1000);
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);

  if (hrs >= 1) {
    const remMins = mins % 60;
    return `Expires in ${hrs}h ${remMins}m`;
  }
  if (mins >= 1) return `Expires in ${mins}m`;
  return `Expires in ${seconds}s`;
}
