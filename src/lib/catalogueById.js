// The price index (src/data/catalogueIndex.js) by id, for the Functions that
// look a treatment or product up: checkout.js and availability.js.

import catalogueIndex from '../data/catalogueIndex.js';

export const catalogueById = new Map(catalogueIndex.map((entry) => [entry.id, entry]));

// The treatment with this id if it can be booked online: priced, with a length
// the calendar can block. Otherwise null.
export function bookableTreatment(id) {
  const entry = catalogueById.get(id);
  return entry && entry.kind === 'treatment' && entry.pence !== null && entry.minutes ? entry : null;
}
