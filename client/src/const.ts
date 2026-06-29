export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Pass returnPath (e.g. "/admin") to redirect there after successful sign-in.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // If the OAuth portal isn't configured (e.g. when hosting outside Manus),
  // return a harmless placeholder instead of building an invalid URL.
  // This stops the whole app from crashing; login is simply unavailable
  // until VITE_OAUTH_PORTAL_URL is set.
  if (!oauthPortalUrl) {
    return "#";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Encode both the redirectUri and an optional returnPath in state
  const statePayload = returnPath ? `${redirectUri}|${returnPath}` : redirectUri;
  const state = btoa(statePayload);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
