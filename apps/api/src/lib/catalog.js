// Shop catalog: the ONLY source of prices (audit 21.10: the price used to come from the client,
// so any item could be bought for 1 coin). Keep in sync with apps/web/src/data/shopCatalog.js.
export const CATALOG = {
  teacher: { emma: 300, james: 300, sofia: 300, alex: 300 },
  theme: { candy: 0, ocean: 200, sunset: 200, forest: 200, galaxy: 250 },
  musicStyle: { lofi: 0, classical: 150, electronic: 150, ambient: 150 },
  frame: { none: 0, gold: 100, neon: 120, leaf: 100 },
};

/** Price of an item, or null if it is not sold. */
export function priceOf(itemType, itemId) {
  const group = Object.prototype.hasOwnProperty.call(CATALOG, itemType) ? CATALOG[itemType] : null;
  if (!group || !Object.prototype.hasOwnProperty.call(group, itemId)) return null;
  return group[itemId];
}
