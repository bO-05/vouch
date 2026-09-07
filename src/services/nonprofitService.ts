import { NonprofitVerification } from '../types';
import { apiUrl } from '../config/api';

export interface NormalizedEinResult {
  raw: string;
  cleanDigits: string;
  formatted: string;
  isValid: boolean;
}

export interface VerificationResult {
  verification: NonprofitVerification | null;
  verified: boolean;
  error?: string;
}

export class NonprofitService {
  /**
   * Normalize an IRS Employer Identification Number (EIN).
   * - Strips whitespace, hyphens, and non-numeric characters.
   * - Handles leading zeros (pads 8-digit EINs to standard 9-digit IRS format).
   * - Validates 9-digit IRS length and non-zero structure.
   * - Returns formatted XX-XXXXXXX.
   */
  public static normalizeEin(raw: string): NormalizedEinResult {
    if (!raw || typeof raw !== 'string') {
      return { raw: '', cleanDigits: '', formatted: '', isValid: false };
    }

    let digits = raw.replace(/\D/g, '');

    // If an 8-digit string was supplied (dropped leading zero), pad to standard 9 digits
    if (digits.length === 8) {
      digits = digits.padStart(9, '0');
    }

    const isValid = digits.length === 9 && digits !== '000000000';
    const formatted = isValid ? `${digits.slice(0, 2)}-${digits.slice(2)}` : raw.trim();

    return {
      raw,
      cleanDigits: digits,
      formatted,
      isValid
    };
  }

  /**
   * Verify an institutional nonprofit organization against ProPublica Explorer & IRS records
   */
  public static async verifyNonprofit(params: { ein?: string; query?: string }): Promise<VerificationResult> {
    const { ein, query } = params;

    let queryParam = '';
    if (ein) {
      const norm = this.normalizeEin(ein);
      queryParam = `ein=${encodeURIComponent(norm.formatted)}`;
    } else if (query) {
      queryParam = `query=${encodeURIComponent(query.trim())}`;
    } else {
      return { verification: null, verified: false, error: 'Either EIN or organization query required.' };
    }

    try {
      const res = await fetch(apiUrl(`/api/verify-nonprofit?${queryParam}`));
      if (res.ok) {
        const data = await res.json();
        if (data && (data.verifiedOnProPublica || data.subsection === '501(c)(3)' || data.ein)) {
          return {
            verification: data,
            verified: true
          };
        }
      } else if (res.status === 404) {
        const errorData = await res.json().catch(() => ({}));
        return {
          verification: null,
          verified: false,
          error: errorData.error || 'Nonprofit organization not found in verified 501(c)(3) database.'
        };
      }
    } catch (err) {
      console.warn('[NonprofitService] Network dropout connecting to ProPublica verifier:', err);
    }

    return {
      verification: null,
      verified: false,
      error: 'Unable to connect to ProPublica verification service.'
    };
  }

  /**
   * Get the formal IRS tax-deductibility badge configuration
   */
  public static getDeductibilityBadge(verification: NonprofitVerification | null): {
    text: string;
    isDeductible: boolean;
    badgeColor: string;
    description: string;
  } {
    if (!verification) {
      return {
        text: 'Unverified Deductibility',
        isDeductible: false,
        badgeColor: '#EF4444',
        description: 'Organization tax status has not been confirmed with IRS records.'
      };
    }

    const is501c3 = verification.subsection?.includes('501(c)(3)');
    if (is501c3) {
      return {
        text: '100% Tax-Deductible • IRS Sec 170(c)(2)',
        isDeductible: true,
        badgeColor: '#10B981',
        description: 'Contributions are deductible as charitable gifts under Section 170 of the Internal Revenue Code.'
      };
    }

    return {
      text: `${verification.subsection || 'Tax-Exempt'} Non-Deductible`,
      isDeductible: false,
      badgeColor: '#F59E0B',
      description: 'Tax-exempt entity, but contributions may not qualify for personal charitable tax deductions.'
    };
  }
}
