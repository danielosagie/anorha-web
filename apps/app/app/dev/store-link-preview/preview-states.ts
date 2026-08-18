// Shared by the server page and the client harness. Kept out of the
// 'use client' module because plain values do not cross the RSC boundary.
export const PREVIEW_STATES = [
  // First visit. No link exists; the address is offered from the org name.
  'empty',
  // The store link is set. This is the state a seller sees every other visit.
  'set',
  // Mid-edit, with the availability answer already back.
  'editing',
  // The one error a seller reads while typing, with clickable alternatives.
  'taken',
  // A reserved word, which fails locally and never reaches the database.
  'reserved',
  // The store link plus the older many-link model behind its collapsed section.
  'set-with-more',
  // The same page with that section opened.
  'set-with-more-open',
] as const;

export type PreviewState = (typeof PREVIEW_STATES)[number];
