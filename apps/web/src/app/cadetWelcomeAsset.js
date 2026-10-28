/**
 * Join a Vite public base path with a public asset path.
 * Works for root deployments ("/"), relative builds ("./"), and subpath hosting.
 */
export function publicAssetUrl(baseUrl, assetPath) {
  const configuredBase = String(baseUrl || '/').trim();
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  let asset = String(assetPath || '');
  while (asset.startsWith('/')) asset = asset.slice(1);
  return `${base}${asset}`;
}
