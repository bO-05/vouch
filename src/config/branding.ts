export interface BrandIdentity {
  id: 'vouch' | 'ayni' | 'hearth';
  name: string;
  tagline: string;
  subTagline: string;
  description: string;
  badge: string;
  spotlightText: string;
  solanaLabel: string;
  protocolAttestation: string;
  communityTag: string;
}

export const BRAND_OPTIONS: Record<string, BrandIdentity> = {
  vouch: {
    id: 'vouch',
    name: 'Vouch',
    tagline: 'Spoken Need. Cryptographic Trust.',
    subTagline: 'Voice-First Mutual Aid & Verifiable Micro-Grants',
    description: 'Direct peer-to-peer mutual aid powered by Google Gemini 1.5 Flash multimodal structuring, ElevenLabs empathetic voice narration, and Solana milestone micro-escrows.',
    badge: 'VOUCH PROTOCOL • SOLANA WEB3 ESCROW VERIFIED',
    spotlightText: 'Welcome to Vouch. Generosity is not a transaction. It is an act of human connection. When an Appalachian nurse, a Kharkiv volunteer, or an East L.A. community cook speaks their need, hearing their real voice in their raw tongue breaks every barrier. Thank you for listening, giving, and sharing.',
    solanaLabel: 'Vouch Mutual Aid',
    protocolAttestation: 'Vouch Protocol • Verifiable Generosity Seal',
    communityTag: 'Vouch'
  },
  ayni: {
    id: 'ayni',
    name: 'Ayni',
    tagline: 'Reciprocal Mutual Aid for an Unpredictable World.',
    subTagline: 'Voice-First Mutual Aid & Verifiable Micro-Grants',
    description: 'Direct peer-to-peer mutual aid powered by Google Gemini 1.5 Flash multimodal structuring, ElevenLabs empathetic voice narration, and Solana milestone micro-escrows.',
    badge: 'AYNI PROTOCOL • SOLANA WEB3 ESCROW VERIFIED',
    spotlightText: 'Welcome to Ayni. In the Andes, Ayni means "today for you, tomorrow for me." Generosity is not a transaction—it is an act of reciprocal human connection. Thank you for listening, giving, and sharing.',
    solanaLabel: 'Ayni Mutual Aid',
    protocolAttestation: 'Ayni Protocol • Verifiable Generosity Seal',
    communityTag: 'Ayni'
  },
  hearth: {
    id: 'hearth',
    name: 'Hearth',
    tagline: 'Verifiable Warmth When Systems Fail.',
    subTagline: 'Voice-First Mutual Aid & Verifiable Micro-Grants',
    description: 'Direct peer-to-peer mutual aid powered by Google Gemini 1.5 Flash multimodal structuring, ElevenLabs empathetic voice narration, and Solana milestone micro-escrows.',
    badge: 'HEARTH PROTOCOL • SOLANA WEB3 ESCROW VERIFIED',
    spotlightText: 'Welcome to Hearth. When winter freezes hit and power grids fail, human warmth is our most vital currency. Thank you for listening, giving, and sharing.',
    solanaLabel: 'Hearth Mutual Aid',
    protocolAttestation: 'Hearth Protocol • Verifiable Generosity Seal',
    communityTag: 'Hearth'
  }
};

// Active Brand: Vouch
export const ACTIVE_BRAND: BrandIdentity = BRAND_OPTIONS.vouch;
