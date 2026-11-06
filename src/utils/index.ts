// Utility: create page URL for react-router
export const createPageUrl = (page: string): string => {
  const [name, query] = page.split('?');
  return query ? `/${name}?${query}` : `/${name}`;
};
