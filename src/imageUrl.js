
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function imageUrl(pic) {
  if (!pic) return '';

  // Leave external URLs and data URLs untouched.
  if (/^(https?:\/\/|data:|blob:)/i.test(pic)) {
    return pic;
  }

  // Old images located in the frontend public folder.
  if (pic.startsWith('/images/') || pic.startsWith('images/')) {
    return pic.startsWith('/') ? pic : `/${pic}`;
  }

  // Newly uploaded images served by the backend.
  return `${BASE}${pic.startsWith('/') ? pic : `/${pic}`}`;
}
