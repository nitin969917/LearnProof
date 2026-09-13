/**
 * Safely resolves the certificate PDF download URL.
 * Prevents any broken "null" URL concatenations and always resolves to a valid endpoint.
 */
export const getCertificatePdfUrl = (cert) => {
  if (!cert) return '#';
  const rawUrl = cert.download_url;
  const backend = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

  if (rawUrl && typeof rawUrl === 'string' && rawUrl !== 'null' && !rawUrl.includes('null') && rawUrl.trim() !== '') {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${backend}${cleanPath}`;
  }

  const certId = cert.certificate_id || cert.id;
  if (!certId) return '#';
  return `${backend}/api/certificates/${certId}/pdf`;
};
