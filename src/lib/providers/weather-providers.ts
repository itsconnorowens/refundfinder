/**
 * Weather Providers - Implementation of various weather data APIs
 */

import {
  WeatherProvider,
  WeatherConditions,
  WeatherForecast,
  WeatherCondition,
  WeatherType,
  WeatherIntensity,
} from '../airport-status-service';

export class OpenWeatherMapProvider implements WeatherProvider {
  name = 'OpenWeatherMap';
  priority = 1;
  rateLimit = {
    requestsPerMinute: 60,
    requestsPerDay: 1000000,
  };
  costPerRequest = 0.0015;
  dataAccuracy = 'high' as const;
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCurrentWeather(airportCode: string): Promise<WeatherConditions> {
    const airport = await this.getAirportCoordinates(airportCode);

    const response = await fetch(
      `${this.baseUrl}/weather?lat=${airport.lat}&lon=${airport.lon}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformToWeatherConditions(data);
  }

  async getForecast(
    airportCode: string,
    hours: number
  ): Promise<WeatherForecast[]> {
    const airport = await this.getAirportCoordinates(airportCode);

    const response = await fetch(
      `${this.baseUrl}/forecast?lat=${airport.lat}&lon=${airport.lon}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`OpenWeatherMap forecast API error: ${response.status}`);
    }

    const data = await response.json();
    return data.list.slice(0, Math.ceil(hours / 3)).map((item: any) => ({
      timestamp: new Date(item.dt * 1000),
      conditions: this.transformToWeatherConditions(item),
      confidence: 0.8,
    }));
  }

  async getHistoricalWeather(
    airportCode: string,
    date: Date
  ): Promise<WeatherConditions> {
    const airport = await this.getAirportCoordinates(airportCode);
    const timestamp = Math.floor(date.getTime() / 1000);

    const response = await fetch(
      `${this.baseUrl}/onecall/timemachine?lat=${airport.lat}&lon=${airport.lon}&dt=${timestamp}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(
        `OpenWeatherMap historical API error: ${response.status}`
      );
    }

    const data = await response.json();
    return this.transformToWeatherConditions(data.current);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=51.5074&lon=-0.1278&appid=${this.apiKey}&units=metric`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async getAirportCoordinates(
    airportCode: string
  ): Promise<{ lat: number; lon: number }> {
    // This would ideally use our airport database
    // For now, return coordinates for major airports
    const airportCoordinates: Record<string, { lat: number; lon: number }> = {
      LHR: { lat: 51.47, lon: -0.4543 },
      JFK: { lat: 40.6413, lon: -73.7781 },
      CDG: { lat: 49.0097, lon: 2.5479 },
      FRA: { lat: 50.0379, lon: 8.5622 },
      DXB: { lat: 25.2532, lon: 55.3657 },
      SIN: { lat: 1.3644, lon: 103.9915 },
      NRT: { lat: 35.772, lon: 140.3928 },
      LAX: { lat: 33.9416, lon: -118.4085 },
      ORD: { lat: 41.9786, lon: -87.9048 },
      ATL: { lat: 33.6407, lon: -84.4277 },
    };

    const coords = airportCoordinates[airportCode.toUpperCase()];
    if (!coords) {
      throw new Error(`Airport coordinates not found for ${airportCode}`);
    }

    return coords;
  }

  private transformToWeatherConditions(data: any): WeatherConditions {
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      visibility: data.visibility ? data.visibility / 1000 : 10, // Convert meters to kilometers
      windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
      windDirection: data.wind.deg || 0,
      pressure: data.main.pressure,
      conditions: this.mapWeatherConditions(data.weather),
      isSevere: this.isSevereWeather(data),
      affectsAviation: this.affectsAviation(data),
    };
  }

  private mapWeatherConditions(weather: any[]): WeatherCondition[] {
    return weather.map((w) => ({
      type: this.mapWeatherType(w.main),
      intensity: this.mapIntensity(w.main),
      description: w.description,
      affectsRunways: this.affectsRunways(w.main),
      affectsVisibility: this.affectsVisibility(w.main),
    }));
  }

  private mapWeatherType(main: string): WeatherType {
    switch (main.toLowerCase()) {
      case 'clear':
        return 'clear';
      case 'clouds':
        return 'cloudy';
      case 'rain':
      case 'drizzle':
        return 'rain';
      case 'snow':
        return 'snow';
      case 'mist':
      case 'fog':
      case 'haze':
        return 'fog';
      case 'thunderstorm':
        return 'storm';
      case 'hail':
        return 'hail';
      case 'ice':
        return 'ice';
      default:
        return 'clear';
    }
  }

  private mapIntensity(main: string): WeatherIntensity {
    // OpenWeatherMap doesn't provide intensity directly
    // This would need to be enhanced based on additional data
    return 'moderate';
  }

  private affectsRunways(main: string): boolean {
    const affectingConditions = ['rain', 'snow', 'hail', 'ice', 'thunderstorm'];
    return affectingConditions.includes(main.toLowerCase());
  }

  private affectsVisibility(main: string): boolean {
    const affectingConditions = [
      'mist',
      'fog',
      'haze',
      'rain',
      'snow',
      'thunderstorm',
    ];
    return affectingConditions.includes(main.toLowerCase());
  }

  private isSevereWeather(data: any): boolean {
    const severeConditions = ['Thunderstorm', 'Squall', 'Tornado'];
    return data.weather.some((w: any) => severeConditions.includes(w.main));
  }

  private affectsAviation(data: any): boolean {
    const aviationAffectingConditions = [
      'Rain',
      'Snow',
      'Mist',
      'Fog',
      'Haze',
      'Dust',
      'Sand',
      'Ash',
      'Squall',
      'Tornado',
      'Thunderstorm',
    ];

    return (
      data.weather.some((w: any) =>
        aviationAffectingConditions.includes(w.main)
      ) ||
      data.visibility < 1000 ||
      data.wind.speed > 15
    ); // High wind
  }
}

export class AviationWeatherCenterProvider implements WeatherProvider {
  name = 'Aviation Weather Center';
  priority = 2;
  rateLimit = {
    requestsPerMinute: 100,
    requestsPerDay: 10000,
  };
  costPerRequest = 0; // Free government service
  dataAccuracy = 'high' as const;
  private baseUrl = 'https://aviationweather.gov/api/data';

  async getCurrentWeather(airportCode: string): Promise<WeatherConditions> {
    const response = await fetch(
      `${this.baseUrl}/metar?ids=${airportCode}&format=json&taf=false&hours=1`
    );

    if (!response.ok) {
      throw new Error(`Aviation Weather Center API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error(`No METAR data available for ${airportCode}`);
    }

    return this.parseMETAR(data[0].rawOb);
  }

  async getForecast(
    airportCode: string,
    hours: number
  ): Promise<WeatherForecast[]> {
    const response = await fetch(
      `${this.baseUrl}/taf?ids=${airportCode}&format=json&hours=${hours}`
    );

    if (!response.ok) {
      throw new Error(
        `Aviation Weather Center TAF API error: ${response.status}`
      );
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error(`No TAF data available for ${airportCode}`);
    }

    // TAF parsing would be more complex - simplified for now
    return [
      {
        timestamp: new Date(),
        conditions: this.parseMETAR(data[0].rawOb),
        confidence: 0.9,
      },
    ];
  }

  async getHistoricalWeather(
    airportCode: string,
    date: Date
  ): Promise<WeatherConditions> {
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(
      `${this.baseUrl}/metar?ids=${airportCode}&format=json&taf=false&hours=24&startTime=${dateStr}T00:00:00Z&endTime=${dateStr}T23:59:59Z`
    );

    if (!response.ok) {
      throw new Error(
        `Aviation Weather Center historical API error: ${response.status}`
      );
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error(`No historical data available for ${airportCode}`);
    }

    return this.parseMETAR(data[0].rawOb);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/metar?ids=KJFK&format=json&taf=false&hours=1`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private parseMETAR(metar: string): WeatherConditions {
    // Simplified METAR parsing - would need full implementation
    // METAR format: KORD 121156Z 36010KT 10SM FEW250 15/12 A2992

    const parts = metar.split(' ');

    return {
      temperature: this.extractTemperature(parts),
      humidity: this.extractHumidity(parts),
      visibility: this.extractVisibility(parts),
      windSpeed: this.extractWindSpeed(parts),
      windDirection: this.extractWindDirection(parts),
      pressure: this.extractPressure(parts),
      conditions: this.extractWeatherConditions(parts),
      isSevere: this.isSevereWeather(parts),
      affectsAviation: this.affectsAviation(parts),
    };
  }

  private extractTemperature(parts: string[]): number {
    // Look for temperature/dewpoint (e.g., "15/12")
    for (const part of parts) {
      if (part.includes('/') && !part.includes('KT')) {
        const temp = parseInt(part.split('/')[0]);
        return temp || 20; // Default temperature
      }
    }
    return 20; // Default temperature
  }

  private extractHumidity(parts: string[]): number {
    // Calculate humidity from temperature/dewpoint
    for (const part of parts) {
      if (part.includes('/') && !part.includes('KT')) {
        const [temp, dewpoint] = part.split('/').map(Number);
        if (temp && dewpoint) {
          // Simplified humidity calculation
          return Math.max(0, Math.min(100, (dewpoint / temp) * 100));
        }
      }
    }
    return 50; // Default humidity
  }

  private extractVisibility(parts: string[]): number {
    // Look for visibility (e.g., "10SM", "1/2SM")
    for (const part of parts) {
      if (part.includes('SM')) {
        const vis = parseFloat(part.replace('SM', ''));
        return vis || 10; // Default visibility
      }
    }
    return 10; // Default visibility
  }

  private extractWindSpeed(parts: string[]): number {
    // Look for wind (e.g., "36010KT")
    for (const part of parts) {
      if (part.includes('KT') && part.length >= 5) {
        const windMatch = part.match(/(\d{3})(\d{2,3})KT/);
        if (windMatch) {
          return parseInt(windMatch[2]) * 1.852; // Convert knots to km/h
        }
      }
    }
    return 0; // Default wind speed
  }

  private extractWindDirection(parts: string[]): number {
    // Look for wind direction (e.g., "36010KT")
    for (const part of parts) {
      if (part.includes('KT') && part.length >= 5) {
        const windMatch = part.match(/(\d{3})(\d{2,3})KT/);
        if (windMatch) {
          return parseInt(windMatch[1]);
        }
      }
    }
    return 0; // Default wind direction
  }

  private extractPressure(parts: string[]): number {
    // Look for pressure (e.g., "A2992", "Q1013")
    for (const part of parts) {
      if (part.startsWith('A')) {
        const pressure = parseInt(part.substring(1));
        return pressure ? pressure / 10 : 1013; // Convert to hPa
      }
      if (part.startsWith('Q')) {
        return parseInt(part.substring(1)) || 1013;
      }
    }
    return 1013; // Default pressure
  }

  private extractWeatherConditions(parts: string[]): WeatherCondition[] {
    const conditions: WeatherCondition[] = [];

    // Look for weather phenomena (e.g., "RA", "SN", "FG")
    for (const part of parts) {
      if (this.isWeatherPhenomenon(part)) {
        conditions.push({
          type: this.mapWeatherPhenomenon(part),
          intensity: 'moderate',
          description: part,
          affectsRunways: this.affectsRunways(part),
          affectsVisibility: this.affectsVisibility(part),
        });
      }
    }

    return conditions.length > 0
      ? conditions
      : [
          {
            type: 'clear',
            intensity: 'light',
            description: 'Clear',
            affectsRunways: false,
            affectsVisibility: false,
          },
        ];
  }

  private isWeatherPhenomenon(part: string): boolean {
    const phenomena = [
      'RA',
      'SN',
      'FG',
      'BR',
      'HZ',
      'DU',
      'SA',
      'FU',
      'VA',
      'SQ',
      'FC',
      'TS',
    ];
    return phenomena.includes(part);
  }

  private mapWeatherPhenomenon(phenomenon: string): WeatherType {
    switch (phenomenon) {
      case 'RA':
        return 'rain';
      case 'SN':
        return 'snow';
      case 'FG':
      case 'BR':
      case 'HZ':
        return 'fog';
      case 'SQ':
      case 'TS':
        return 'storm';
      case 'DU':
      case 'SA':
      case 'FU':
      case 'VA':
        return 'clear'; // Simplified
      default:
        return 'clear';
    }
  }

  private affectsRunways(phenomenon: string): boolean {
    const affecting = ['RA', 'SN', 'SQ', 'TS'];
    return affecting.includes(phenomenon);
  }

  private affectsVisibility(phenomenon: string): boolean {
    const affecting = ['FG', 'BR', 'HZ', 'DU', 'SA', 'FU', 'VA', 'RA', 'SN'];
    return affecting.includes(phenomenon);
  }

  private isSevereWeather(parts: string[]): boolean {
    const severePhenomena = ['SQ', 'TS', 'FC'];
    return parts.some((part) => severePhenomena.includes(part));
  }

  private affectsAviation(parts: string[]): boolean {
    const aviationAffecting = [
      'RA',
      'SN',
      'FG',
      'BR',
      'HZ',
      'DU',
      'SA',
      'FU',
      'VA',
      'SQ',
      'FC',
      'TS',
    ];
    return parts.some((part) => aviationAffecting.includes(part));
  }
}

export class WeatherAPIProvider implements WeatherProvider {
  name = 'WeatherAPI';
  priority = 3;
  rateLimit = {
    requestsPerMinute: 30,
    requestsPerDay: 10000,
  };
  costPerRequest = 0.001;
  dataAccuracy = 'medium' as const;
  private apiKey: string;
  private baseUrl = 'http://api.weatherapi.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCurrentWeather(airportCode: string): Promise<WeatherConditions> {
    const airport = await this.getAirportCoordinates(airportCode);

    const response = await fetch(
      `${this.baseUrl}/current.json?key=${this.apiKey}&q=${airport.lat},${airport.lon}&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformToWeatherConditions(data.current);
  }

  async getForecast(
    airportCode: string,
    hours: number
  ): Promise<WeatherForecast[]> {
    const airport = await this.getAirportCoordinates(airportCode);

    const response = await fetch(
      `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${airport.lat},${airport.lon}&days=1&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`WeatherAPI forecast error: ${response.status}`);
    }

    const data = await response.json();
    return data.forecast.forecastday[0].hour
      .slice(0, Math.ceil(hours))
      .map((hour: any) => ({
        timestamp: new Date(hour.time),
        conditions: this.transformToWeatherConditions(hour),
        confidence: 0.7,
      }));
  }

  async getHistoricalWeather(
    airportCode: string,
    date: Date
  ): Promise<WeatherConditions> {
    const airport = await this.getAirportCoordinates(airportCode);
    const dateStr = date.toISOString().split('T')[0];

    const response = await fetch(
      `${this.baseUrl}/history.json?key=${this.apiKey}&q=${airport.lat},${airport.lon}&dt=${dateStr}&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`WeatherAPI historical error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformToWeatherConditions(data.forecast.forecastday[0].day);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/current.json?key=${this.apiKey}&q=London&aqi=no`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async getAirportCoordinates(
    airportCode: string
  ): Promise<{ lat: number; lon: number }> {
    // Same as OpenWeatherMap - would ideally use our airport database
    const airportCoordinates: Record<string, { lat: number; lon: number }> = {
      LHR: { lat: 51.47, lon: -0.4543 },
      JFK: { lat: 40.6413, lon: -73.7781 },
      CDG: { lat: 49.0097, lon: 2.5479 },
      FRA: { lat: 50.0379, lon: 8.5622 },
      DXB: { lat: 25.2532, lon: 55.3657 },
      SIN: { lat: 1.3644, lon: 103.9915 },
      NRT: { lat: 35.772, lon: 140.3928 },
      LAX: { lat: 33.9416, lon: -118.4085 },
      ORD: { lat: 41.9786, lon: -87.9048 },
      ATL: { lat: 33.6407, lon: -84.4277 },
    };

    const coords = airportCoordinates[airportCode.toUpperCase()];
    if (!coords) {
      throw new Error(`Airport coordinates not found for ${airportCode}`);
    }

    return coords;
  }

  private transformToWeatherConditions(data: any): WeatherConditions {
    return {
      temperature: data.temp_c || data.temp_celsius || 20,
      humidity: data.humidity || 50,
      visibility: data.vis_km || 10,
      windSpeed: data.wind_kph || 0,
      windDirection: data.wind_degree || 0,
      pressure: data.pressure_mb || 1013,
      conditions: this.mapWeatherConditions(data.condition),
      isSevere: this.isSevereWeather(data),
      affectsAviation: this.affectsAviation(data),
    };
  }

  private mapWeatherConditions(condition: any): WeatherCondition[] {
    if (!condition) {
      return [
        {
          type: 'clear',
          intensity: 'light',
          description: 'Clear',
          affectsRunways: false,
          affectsVisibility: false,
        },
      ];
    }

    return [
      {
        type: this.mapWeatherType(condition.text),
        intensity: 'moderate',
        description: condition.text,
        affectsRunways: this.affectsRunways(condition.text),
        affectsVisibility: this.affectsVisibility(condition.text),
      },
    ];
  }

  private mapWeatherType(text: string): WeatherType {
    const textLower = text.toLowerCase();

    if (textLower.includes('clear') || textLower.includes('sunny'))
      return 'clear';
    if (textLower.includes('cloud')) return 'cloudy';
    if (textLower.includes('rain') || textLower.includes('drizzle'))
      return 'rain';
    if (textLower.includes('snow')) return 'snow';
    if (textLower.includes('fog') || textLower.includes('mist')) return 'fog';
    if (textLower.includes('storm') || textLower.includes('thunder'))
      return 'storm';
    if (textLower.includes('hail')) return 'hail';
    if (textLower.includes('ice')) return 'ice';

    return 'clear';
  }

  private affectsRunways(text: string): boolean {
    const textLower = text.toLowerCase();
    const affecting = ['rain', 'snow', 'hail', 'ice', 'storm', 'thunder'];
    return affecting.some((condition) => textLower.includes(condition));
  }

  private affectsVisibility(text: string): boolean {
    const textLower = text.toLowerCase();
    const affecting = ['fog', 'mist', 'haze', 'rain', 'snow', 'storm'];
    return affecting.some((condition) => textLower.includes(condition));
  }

  private isSevereWeather(data: any): boolean {
    const text = data.condition?.text?.toLowerCase() || '';
    const severe = ['storm', 'thunder', 'tornado', 'hurricane', 'blizzard'];
    return severe.some((condition) => text.includes(condition));
  }

  private affectsAviation(data: any): boolean {
    const text = data.condition?.text?.toLowerCase() || '';
    const affecting = [
      'rain',
      'snow',
      'fog',
      'mist',
      'storm',
      'thunder',
      'hail',
      'ice',
    ];
    return affecting.some((condition) => text.includes(condition));
  }
}
