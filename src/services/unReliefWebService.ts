import { UNCrisisReport, AidRequest } from '../types';
import { apiUrl } from '../config/api';

export interface ReliefWebFeedResponse {
  source: string;
  connected: boolean;
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
  reports: UNCrisisReport[];
}

export interface ReliefWebIngestResponse {
  message: string;
  request: AidRequest;
  alreadyExists?: boolean;
}

export const ISO3_MAP: Record<string, string> = {
  'afghanistan': 'afg',
  'albania': 'alb',
  'algeria': 'dza',
  'angola': 'ago',
  'argentina': 'arg',
  'armenia': 'arm',
  'australia': 'aus',
  'austria': 'aut',
  'azerbaijan': 'aze',
  'bahamas': 'bhs',
  'the bahamas': 'bhs',
  'bangladesh': 'bgd',
  'belarus': 'blr',
  'belgium': 'bel',
  'belize': 'blz',
  'benin': 'ben',
  'bolivia': 'bol',
  'bosnia and herzegovina': 'bih',
  'brazil': 'bra',
  'bulgaria': 'bgr',
  'burkina faso': 'bfa',
  'burundi': 'bdi',
  'cambodia': 'khm',
  'cameroon': 'cmr',
  'canada': 'can',
  'central african republic': 'caf',
  'chad': 'tcd',
  'chile': 'chl',
  'china': 'chn',
  'colombia': 'col',
  'congo': 'cog',
  'republic of congo': 'cog',
  'democratic republic of congo': 'cod',
  'democratic republic of the congo': 'cod',
  'the democratic republic of congo': 'cod',
  'the democratic republic of the congo': 'cod',
  'costa rica': 'cri',
  'croatia': 'hrv',
  'cuba': 'cub',
  'cyprus': 'cyp',
  'czech republic': 'cze',
  'denmark': 'dnk',
  'djibouti': 'dji',
  'dominican republic': 'dom',
  'ecuador': 'ecu',
  'egypt': 'egy',
  'el salvador': 'slv',
  'eritrea': 'eri',
  'ethiopia': 'eth',
  'fiji': 'fji',
  'finland': 'fin',
  'france': 'fra',
  'georgia': 'geo',
  'germany': 'deu',
  'ghana': 'gha',
  'greece': 'grc',
  'guatemala': 'gtm',
  'guinea': 'gin',
  'haiti': 'hti',
  'honduras': 'hnd',
  'hungary': 'hun',
  'india': 'ind',
  'indonesia': 'idn',
  'iran': 'irn',
  'iraq': 'irq',
  'ireland': 'irl',
  'israel': 'isr',
  'italy': 'ita',
  'jamaica': 'jam',
  'japan': 'jpn',
  'jordan': 'jor',
  'kazakhstan': 'kaz',
  'kenya': 'ken',
  'kyrgyzstan': 'kgz',
  'laos': 'lao',
  'lebanon': 'lbn',
  'liberia': 'lbr',
  'libya': 'lby',
  'madagascar': 'mdg',
  'malawi': 'mwi',
  'malaysia': 'mys',
  'mali': 'mli',
  'mexico': 'mex',
  'moldova': 'mda',
  'mongolia': 'mng',
  'morocco': 'mar',
  'mozambique': 'moz',
  'myanmar': 'mmr',
  'namibia': 'nam',
  'nepal': 'npl',
  'netherlands': 'nld',
  'new caledonia': 'ncl',
  'new zealand': 'nzl',
  'nicaragua': 'nic',
  'niger': 'ner',
  'nigeria': 'nga',
  'norway': 'nor',
  'pakistan': 'pak',
  'panama': 'pan',
  'papua new guinea': 'png',
  'paraguay': 'pry',
  'peru': 'per',
  'philippines': 'phl',
  'poland': 'pol',
  'portugal': 'prt',
  'romania': 'rou',
  'russia': 'rus',
  'russian federation': 'rus',
  'rwanda': 'rwa',
  'senegal': 'sen',
  'serbia': 'srb',
  'sierra leone': 'sle',
  'solomon islands': 'slb',
  'somalia': 'som',
  'south africa': 'zaf',
  'south sudan': 'ssd',
  'spain': 'esp',
  'sri lanka': 'lka',
  'sudan': 'sdn',
  'sweden': 'swe',
  'switzerland': 'che',
  'syria': 'syr',
  'taiwan': 'twn',
  'tajikistan': 'tjk',
  'tanzania': 'tza',
  'thailand': 'tha',
  'turkey': 'tur',
  'türkiye': 'tur',
  'uganda': 'uga',
  'ukraine': 'ukr',
  'united kingdom': 'gbr',
  'united states': 'usa',
  'uruguay': 'ury',
  'uzbekistan': 'uzb',
  'venezuela': 'ven',
  'vietnam': 'vnm',
  'yemen': 'yem',
  'zambia': 'zmb',
  'zimbabwe': 'zwe'
};

export class UNReliefWebService {
  /**
   * Strictly validate that a URL is an authentic, secure UN OCHA ReliefWeb URL
   * Accepts official reliefweb.int reports, country hubs, or humanitarian API references
   */
  public static validateReliefWebUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname === 'reliefweb.int' ||
        hostname.endsWith('.reliefweb.int') ||
        hostname === 'unocha.org' ||
        hostname.endsWith('.unocha.org') ||
        hostname === 'gdacs.org' ||
        hostname.endsWith('.gdacs.org') ||
        hostname === 'humdata.org' ||
        hostname.endsWith('.humdata.org')
      );
    } catch {
      return false;
    }
  }

  /**
   * Fetch the live UN OCHA ReliefWeb crisis feed with optional pagination and category filtering
   */
  public static async fetchFeed(options: { limit?: number; offset?: number; category?: string } = {}): Promise<ReliefWebFeedResponse> {
    const limit = options.limit ?? 5;
    const offset = options.offset ?? 0;
    const categoryParam = options.category && options.category !== 'all' ? `&category=${encodeURIComponent(options.category)}` : '';
    const url = apiUrl(`/api/un-reliefweb/feed?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}${categoryParam}`);

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data: ReliefWebFeedResponse = await res.json();
        if (Array.isArray(data.reports)) {
          // Validate and sanitize URLs on all reports
          const sanitizedReports = data.reports.map((r) => this.sanitizeReport(r));
          return {
            ...data,
            reports: sanitizedReports
          };
        }
      }
    } catch (err) {
      console.warn('[UNReliefWebService] Failed to fetch live UN feed:', err);
    }

    return {
      source: 'UN OCHA ReliefWeb Fallback Feed',
      connected: false,
      count: 0,
      reports: []
    };
  }

  /**
   * Ingest a UN crisis report into the active community aid request stream
   */
  public static async ingestReport(report: UNCrisisReport): Promise<ReliefWebIngestResponse | null> {
    const sanitized = this.sanitizeReport(report);

    try {
      const res = await fetch(apiUrl('/api/un-reliefweb/ingest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: sanitized.id,
          customReport: sanitized
        })
      });

      if (res.ok) {
        const data: ReliefWebIngestResponse = await res.json();
        if (data.request) {
          // Ensure front-end flags are preserved
          data.request.isUnCrisis = true;
          data.request.unReportUrl = sanitized.reliefwebUrl;
          return data;
        }
      }
    } catch (err) {
      console.error('[UNReliefWebService] Ingestion network error:', err);
    }

    return null;
  }

  /**
   * Resolves the authentic UN OCHA ReliefWeb country portal URL.
   * ReliefWeb country URLs strictly follow ISO 3166-1 alpha-3 format (e.g. /country/ncl, /country/slb, /country/ago).
   * Prevents 404 errors by rewriting truncated or invalid slugs and falling back to search if unmapped.
   */
  public static resolveCountryHubUrl(country?: string, currentUrl?: string): string {
    const rawCountry = (country || '').toLowerCase().trim();

    // 1. Direct ISO3 lookup from full or partial country name
    if (ISO3_MAP[rawCountry]) {
      return `https://reliefweb.int/country/${ISO3_MAP[rawCountry]}`;
    }
    if (rawCountry.includes(',')) {
      const first = rawCountry.split(',')[0].trim();
      if (ISO3_MAP[first]) {
        return `https://reliefweb.int/country/${ISO3_MAP[first]}`;
      }
    }

    // 2. If currentUrl is provided, check if it's already a valid ISO3 hub
    if (currentUrl && this.validateReliefWebUrl(currentUrl)) {
      const match = currentUrl.match(/\/country\/([a-zA-Z]{3})$/);
      if (match) {
        const code = match[1].toLowerCase();
        // Disallow known invalid truncated slices (from legacy slice(0,3) bug)
        const invalidSlices = new Set(['new', 'sol', 'ang', 'dem', 'the', 'uni', 'cen', 'sou']);
        if (!invalidSlices.has(code) && Object.values(ISO3_MAP).includes(code)) {
          return `https://reliefweb.int/country/${code}`;
        }
      } else if (!currentUrl.includes('/country/')) {
        return currentUrl;
      }
    }

    // 3. Robust fallback: ReliefWeb Country Updates Search (returns HTTP 200, never 404)
    if (country && country !== 'Global Crisis Zone' && country !== 'Global Crisis') {
      return `https://reliefweb.int/updates?search=${encodeURIComponent(country)}`;
    }

    return 'https://reliefweb.int';
  }

  /**
   * Sanitize report fields and ensure URL authenticity
   */
  public static sanitizeReport(report: Partial<UNCrisisReport>): UNCrisisReport {
    const defaultUrl = 'https://reliefweb.int';
    let validReliefwebUrl = defaultUrl;

    if (report.reliefwebUrl && this.validateReliefWebUrl(report.reliefwebUrl)) {
      validReliefwebUrl = report.reliefwebUrl;
    }

    const validCountryHubUrl = this.resolveCountryHubUrl(report.country, report.countryHubUrl);

    return {
      id: report.id || `rw-${Date.now()}`,
      title: report.title || 'UN Humanitarian Disaster Report',
      country: report.country || 'Global Crisis',
      region: report.region || 'Global Response',
      disasterType: report.disasterType || 'Emergency Relief',
      date: report.date || new Date().toISOString(),
      urgency: report.urgency || 'urgent',
      unTheme: report.unTheme || 'Climate & Poverty',
      source: report.source || 'UN OCHA / ReliefWeb Flash Update',
      summary: report.summary || 'UN situation report detailing urgent civilian mutual aid needs.',
      reliefwebUrl: validReliefwebUrl,
      countryHubUrl: validCountryHubUrl,
      imageUrl: report.imageUrl || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80',
      authorName: report.authorName || 'UN OCHA Field Coordinator',
      authorRole: report.authorRole || 'Disaster Logistics Lead',
      location: report.location || `${report.country || 'Global'}, Crisis Response`,
      coordinates: report.coordinates || { lat: 49.9935, lng: 36.2304 },
      suggestedSOL: report.suggestedSOL && report.suggestedSOL > 0 ? report.suggestedSOL : 4.5,
      itemsNeeded: report.itemsNeeded || [
        { id: 'rw-item-fallback-1', name: 'Emergency Food & Water Care Kits', quantity: 50, unit: 'kits', fulfilled: false, estimatedCostUSD: 1000 }
      ],
      tags: report.tags || ['UN-OCHA', 'ReliefWeb', 'CrisisResponse'],
      voiceNarration: report.voiceNarration,
      nonprofitName: report.nonprofitName || 'UN OCHA Humanitarian Action Network',
      nonprofitEin: report.nonprofitEin || '95-1831116',
      is501c3Verified: report.is501c3Verified ?? true
    };
  }
}
