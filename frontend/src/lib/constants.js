export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://void-822012759095.europe-west1.run.app/api'

export const API_ORIGIN = API_BASE.replace(/\/api$/, '');

/** Rotating Sanskrit / Hindi quotes for workspace empty states */
export const WORKSPACE_QUOTES = [
  { deva: 'विद्या ददाति विनयम्', gloss: 'Knowledge bestows humility.' },
  { deva: 'तेजस्वि नावधीतमस्तु', gloss: 'May our learning be brilliant.' },
  { deva: 'सा विद्या या विमुक्तये', gloss: 'That alone is knowledge which liberates.' },
  { deva: 'अन्वेषणं ज्ञानस्य मार्गः', gloss: 'Inquiry is the path to knowledge.' },
  { deva: 'योगः कर्मसु कौशलम्', gloss: 'Excellence in action is yoga.' },
];

export function pickWorkspaceQuote(seed = 0) {
  return WORKSPACE_QUOTES[Math.abs(seed) % WORKSPACE_QUOTES.length];
}
