import { router, type Href } from 'expo-router';

/**
 * Safely navigates back if a previous screen exists in the history stack,
 * otherwise falls back to a default route to prevent 'GO_BACK was not handled' warnings.
 */
export const safeGoBack = (
  fallbackHref: Href = '/screens/client/(tabs)/ClientHomeScreen' as Href
) => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
};

