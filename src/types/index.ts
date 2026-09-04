export type UNTheme = 
  | 'Climate & Poverty' 
  | 'Youth Leadership' 
  | 'Equity & Inclusion' 
  | 'Ethical Giving' 
  | 'Tech-Driven Giving';

export type AidCategory = 
  | 'Food & Nutrition' 
  | 'Shelter & Warmth' 
  | 'Education & Tech' 
  | 'Healthcare & Medicine' 
  | 'Disaster Relief' 
  | 'Community Tools';

export type RequestStatus = 'active' | 'in_review' | 'fulfilled';
export type UrgencyLevel = 'urgent' | 'moderate' | 'ongoing';

export interface NeededItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  fulfilled: boolean;
  estimatedCostUSD?: number;
}

export interface AidRequest {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorRole: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  category: AidCategory;
  unTheme: UNTheme;
  urgency: UrgencyLevel;
  status: RequestStatus;
  targetAmountSOL: number;
  raisedAmountSOL: number;
  donorCount: number;
  itemsNeeded: NeededItem[];
  voiceNarrationText: string;
  audioDurationSec: number;
  imageUrl: string;
  verifiedProofImageUrl?: string;
  proofNotes?: string;
  proofConfidenceScore?: number;
  createdAt: string;
  tags: string[];
}

export interface MicroGrant {
  id: string;
  requestId: string;
  requestTitle: string;
  donorName: string;
  amountSOL: number;
  amountUSD: number;
  txSignature: string;
  timestamp: string;
  message?: string;
  isEscrowLocked: boolean;
}

export interface VoicePlaybackState {
  isPlaying: boolean;
  currentRequestId: string | null;
  currentTitle: string;
  currentNarrator: string;
  progress: number; // 0 to 100
  duration: number; // seconds
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: string;
}
