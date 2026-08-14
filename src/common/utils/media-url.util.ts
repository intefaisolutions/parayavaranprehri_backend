/** Strip signed/query params so we persist a stable S3 object URL. */
export function permanentS3Url(url?: string): string {
  if (!url) return '';
  if (/amazonaws\.com|\.s3[.-]/i.test(url) || /[?&]X-Amz-/i.test(url)) {
    return url.split('?')[0];
  }
  return url;
}

export function isS3MediaUrl(url?: string): boolean {
  if (!url) return false;
  return /amazonaws\.com|\.s3[.-]/i.test(url) || /[?&]X-Amz-/i.test(url);
}

/**
 * Append updatedAt so Android/RN Image cache does not keep the previous
 * photo when Admin overwrites or replaces the file.
 */
export function withMediaCacheBust(
  url?: string,
  updatedAt?: Date | string | number | null,
): string {
  if (!url) return '';
  const base = permanentS3Url(url) || url;
  const t =
    updatedAt instanceof Date
      ? updatedAt.getTime()
      : updatedAt
        ? new Date(updatedAt).getTime()
        : 0;
  if (!t || Number.isNaN(t)) return base;
  return `${base}${base.includes('?') ? '&' : '?'}v=${t}`;
}
