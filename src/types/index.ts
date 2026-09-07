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

export interface ReceiptLineItem {
  description: string;
  qty: number;
  unitPriceUSD: number;
  totalUSD: number;
  matchedTicketItem: string;
  matchScore: number;
}

export interface ReceiptDetails {
  storeName: string;
  receiptDate: string;
  currency: string;
  totalUSD: number;
  lineItems: ReceiptLineItem[];
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
  receiptDetails?: ReceiptDetails;
  proofType?: 'photo_delivery' | 'receipt_ocr';
  createdAt: string;
  tags: string[];
  originalLanguage?: string;
  originalLanguageLabel?: string;
  originalTranscript?: string;
  voiceNarrationOriginal?: string;
  voiceNarrationEnglish?: string;
  unReportUrl?: string;
  isUnCrisis?: boolean;
  climateData?: LiveClimateData;
  nonprofitEin?: string;
  nonprofitName?: string;
  is501c3Verified?: boolean;
  recipientWallet: string;
}

export interface LiveClimateData {
  temperatureC: number;
  temperatureF: number;
  apparentTemperatureC: number;
  humidity: number;
  precipitationMm: number;
  windSpeedKmh: number;
  weatherCondition: string;
  weatherCode: number;
  alertBadge?: string;
  alertLevel: 'none' | 'cold_freeze' | 'extreme_heat' | 'storm_warning';
  lastUpdated: string;
  source: string;
}

export interface SnowflakeWarehouseMetrics {
  warehouseName: string;
  clusterStatus: 'ACTIVE' | 'SUSPENDED' | 'RESUMING';
  region: string;
  database: string;
  schema: string;
  totalGrantsLogged: number;
  totalSOLProcessed: number;
  totalUSDProcessed: number;
  averageVelocityMinutes: number;
  themeBreakdown: Array<{
    theme: UNTheme;
    grantsCount: number;
    solTotal: number;
    percentOfTotal: number;
    cortexCredibilityAvg: number;
  }>;
  cortexAIStatus: {
    model: string;
    anomalyDetectionActive: boolean;
    averageCredibilityScore: number;
    flaggedSuspiciousGrants: number;
  };
  recentQueries: Array<{
    queryId: string;
    sqlText: string;
    executionTimeMs: number;
    rowsProduced: number;
    timestamp: string;
    status: 'SUCCESS' | 'RUNNING';
  }>;
}

export interface NonprofitVerification {
  ein: string;
  name: string;
  city: string;
  state: string;
  country: string;
  subsection: string;
  classification: string;
  nteeCode?: string;
  deductibility: string;
  deductibilityBadge?: string;
  deductibilityCode?: string;
  isDeductible?: boolean;
  assetsUSD?: number;
  incomeUSD?: number;
  revenueUSD?: number;
  form990Year?: number;
  transparencyScore: number;
  verifiedOnProPublica: boolean;
  proPublicaUrl?: string;
}

export interface ProofCertificate {
  certificateId: string;
  grantId: string;
  requestId: string;
  recipientTitle: string;
  recipientLocation: string;
  donorName: string;
  amountSOL: number;
  amountUSD: number;
  solPriceAtGrant: number;
  solanaTxSignature: string;
  solscanUrl: string;
  escrowUnlockedTimestamp: string;
  geminiVerificationScore: number;
  verifiedStoreOrDelivery: string;
  matchedItems: string[];
  unTheme: UNTheme;
  sha256ProofHash: string;
}

export interface MicroGrant {
  id: string;
  requestId: string;
  requestTitle: string;
  donorName: string;
  amountSOL: number;
  amountUSD: number;
  lamports: number;
  txSignature: string;
  timestamp: string;
  message?: string;
  isEscrowLocked: boolean;
  solanaPayUri?: string;
  certificateHash?: string;
  recipientWallet?: string;
  slot?: number;
  blockTime?: number;
  confirmationStatus?: 'confirmed' | 'finalized' | 'simulated';
  feeLamports?: number;
  isOnChain?: boolean;
  simulationReason?: string;
  relayerMode?: string;
  sponsorBadge?: string;
  sponsorRole?: string;
  zeroWalletRequiredForJudges?: boolean;
  explorerUrl?: string;
  solscanUrl?: string;
}

export interface SolanaPriceData {
  priceUSD: number;
  change24h: number;
  lamportsPerUSD: number;
  lamportsPerSOL: number;
  source: string;
  lastUpdated: string;
  status: 'live' | 'cached';
}

export interface UNCrisisReport {
  id: string;
  title: string;
  country: string;
  region?: string;
  disasterType: string;
  date: string;
  urgency: UrgencyLevel;
  unTheme: UNTheme;
  source: string;
  summary: string;
  reliefwebUrl: string;
  countryHubUrl?: string;
  imageUrl: string;
  authorName?: string;
  authorRole?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  suggestedSOL?: number;
  itemsNeeded?: NeededItem[];
  tags?: string[];
  voiceNarration?: string;
  climateData?: LiveClimateData;
  nonprofitName?: string;
  nonprofitEin?: string;
  is501c3Verified?: boolean;
}

export interface VoicePlaybackState {
  isPlaying: boolean;
  currentRequestId: string | null;
  currentTitle: string;
  currentNarrator: string;
  languageMode?: 'original' | 'english';
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

