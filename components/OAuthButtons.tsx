"use client";

import {
  buildAuthorizationRequest,
  type OAuthProvider,
} from "@/lib/oauth";

export interface OAuthButtonsProps {
  /** Providers to render a button for. */
  providers: OAuthProvider[];
  /** Callback's redirect URI registered with each provider. */
  redirectUri: string;
  /**
   * Invoked with the built authorization URL and the `state` to persist before
   * navigating. Defaults to a full-page redirect after stashing state in
   * sessionStorage.
   */
  onAuthorize?: (url: string, state: string, provider: OAuthProvider) => void;
}

/**
 * Renders one button per OAuth provider. Clicking builds the provider's
 * authorization URL (with a fresh anti-CSRF `state`) and hands off to
 * `onAuthorize`.
 */
export function OAuthButtons({
  providers,
  redirectUri,
  onAuthorize,
}: OAuthButtonsProps) {
  function handleClick(provider: OAuthProvider) {
    const { url, state } = buildAuthorizationRequest(provider, { redirectUri });
    if (onAuthorize) {
      onAuthorize(url, state, provider);
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`oauth_state:${provider.id}`, state);
      window.location.assign(url);
    }
  }

  if (providers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => handleClick(provider)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          {provider.label}
        </button>
      ))}
    </div>
  );
}

export default OAuthButtons;
