import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ensures every page navigation starts at the top instead of
// preserving scroll position from the previous page (which made
// clicking a listing feel like it jumped to the footer).
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window.history ? 'instant' : 'auto' });
  }, [pathname, search]);

  return null;
}
