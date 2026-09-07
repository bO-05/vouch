import { LiveClimateData } from '../types';
import { apiUrl } from '../config/api';

export class WeatherService {
  private static CACHE_TTL_MS = 60000; // 60 seconds
  private static cache = new Map<string, { data: LiveClimateData; timestamp: number }>();

  /**
   * Validate geographical coordinates
   * Latitude: [-90, 90], Longitude: [-180, 180], must be finite numbers
   */
  public static isValidCoordinates(lat: unknown, lon: unknown): boolean {
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    if (isNaN(lat) || isNaN(lon)) return false;
    if (!isFinite(lat) || !isFinite(lon)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lon < -180 || lon > 180) return false;
    return true;
  }

  /**
   * Fetch real-time geo-climate telemetry for latitude and longitude
   */
  public static async getClimate(lat: number, lon: number): Promise<LiveClimateData> {
    if (!this.isValidCoordinates(lat, lon)) {
      console.warn(`[WeatherService] Invalid coordinates provided: lat=${lat}, lon=${lon}. Using default fallback.`);
      return this.getDefaultClimate(lat, lon);
    }

    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await fetch(apiUrl(`/api/weather/${lat}/${lon}`));
      if (res.ok) {
        const data: LiveClimateData = await res.json();
        if (typeof data.temperatureC === 'number' && data.weatherCondition) {
          this.cache.set(cacheKey, { data, timestamp: now });
          return data;
        }
      }
    } catch (err) {
      console.warn(`[WeatherService] Network dropout fetching climate for ${lat}, ${lon}:`, err);
    }

    const fallback = this.getDefaultClimate(lat, lon);
    this.cache.set(cacheKey, { data: fallback, timestamp: now });
    return fallback;
  }

  /**
   * Safe heuristic climate fallback when backend is unreachable or offline
   */
  public static getDefaultClimate(lat: number = 40.71, lon: number = -74.00): LiveClimateData {
    let tempC = 18.0;
    let condition = 'Partly Cloudy';
    let badge = 'Variable Clouds';
    let alertLevel: LiveClimateData['alertLevel'] = 'none';
    let code = 2;

    if (lat > 45) {
      tempC = -14.2;
      condition = 'Snowfall & Ice';
      badge = 'Sub-Zero Freeze Alert (-14.2°C)';
      alertLevel = 'cold_freeze';
      code = 73;
    } else if (lat < 10 && lat > -5) {
      tempC = 36.5;
      condition = 'Severe Heat';
      badge = 'Extreme Heatwave Alert (36.5°C)';
      alertLevel = 'extreme_heat';
      code = 0;
    } else if (lat < -15 && lat > -25) {
      tempC = 27.2;
      condition = 'Heavy Rain Showers';
      badge = 'Flood & Storm Watch';
      alertLevel = 'storm_warning';
      code = 81;
    }

    return {
      temperatureC: tempC,
      temperatureF: Number(((tempC * 9/5) + 32).toFixed(1)),
      apparentTemperatureC: Number((tempC - 2.0).toFixed(1)),
      humidity: 72,
      precipitationMm: code >= 70 ? 2.5 : 0,
      windSpeedKmh: 16.0,
      weatherCondition: condition,
      weatherCode: code,
      alertBadge: badge,
      alertLevel,
      lastUpdated: new Date().toISOString(),
      source: 'Open-Meteo Client Fallback'
    };
  }

  /**
   * Format climate badge color and styling based on hazard level
   */
  public static getAlertBadgeStyle(alertLevel: LiveClimateData['alertLevel'], tempC: number): {
    bg: string;
    border: string;
    color: string;
  } {
    if (alertLevel === 'cold_freeze' || tempC <= 0) {
      return {
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.35)',
        color: '#38BDF8'
      };
    }
    if (alertLevel === 'extreme_heat' || tempC >= 35) {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.35)',
        color: '#F87171'
      };
    }
    if (alertLevel === 'storm_warning') {
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.35)',
        color: '#FCD34D'
      };
    }
    return {
      bg: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.18)',
      color: '#E2E8F0'
    };
  }
}
