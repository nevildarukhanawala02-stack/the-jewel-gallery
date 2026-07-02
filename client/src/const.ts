export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Admin login now uses our own /admin-login page (no Manus OAuth)
export const getLoginUrl = (returnPath?: string): string => {
  const base = "/admin-login";
  return returnPath ? `${base}?return=${encodeURIComponent(returnPath)}` : base;
};
