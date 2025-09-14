import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { GeocodingResult, Coordinates, Address, ErrorCodes } from '../types/api.types';
import { ViaCepResponse, GoogleMapsGeocodingResponse } from '../types/external.types';
import { formatCep, validateCepOrThrow } from '../utils/cep.util';
import { retryWithBackoff } from '../utils/response.util';
import cacheService from './cache.service';
import config from '../config';
import winston from 'winston';

class GeocodingService {
  private viaCepClient: AxiosInstance;
  private googleMapsClient: AxiosInstance;
  private logger: winston.Logger;

  constructor() {
    this.viaCepClient = axios.create({
      baseURL: 'https://viacep.com.br/ws',
      timeout: 5000,
    });

    this.googleMapsClient = axios.create({
      baseURL: 'https://maps.googleapis.com/maps/api/geocode',
      timeout: 8000,
    });

    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }

  async geocodeCep(cep: string): Promise<GeocodingResult> {
    validateCepOrThrow(cep);
    const cleanCep = formatCep(cep);

    const cacheKey = cacheService.generateKey('geocoding', cleanCep);
    const cachedResult = await cacheService.get<GeocodingResult>(cacheKey);
    
    if (cachedResult) {
      this.logger.info(`Cache hit for CEP: ${cleanCep}`);
      return cachedResult;
    }

    try {
      const addressData = await this.getAddressFromViaCep(cleanCep);
      const coordinates = await this.getCoordinatesFromAddress(addressData);
      
      const result: GeocodingResult = {
        coordinates,
        address: addressData,
      };

      await cacheService.set(cacheKey, result);
      
      this.logger.info(`Successfully geocoded CEP: ${cleanCep}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to geocode CEP ${cleanCep}:`, error);
      throw error;
    }
  }

  private async getAddressFromViaCep(cep: string): Promise<Address> {
    try {
      const response: AxiosResponse<ViaCepResponse> = await retryWithBackoff(
        () => this.viaCepClient.get(`/${cep}/json/`),
        3,
        1000
      );

      const data = response.data;

      if (data.erro) {
        throw new Error(ErrorCodes.CEP_NOT_FOUND);
      }

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        ibge: data.ibge,
        gia: data.gia,
        ddd: data.ddd,
        siafi: data.siafi,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(ErrorCodes.CEP_NOT_FOUND);
        }
        throw new Error(ErrorCodes.SERVICE_UNAVAILABLE);
      }
      throw error;
    }
  }

  private async getCoordinatesFromAddress(address: Address): Promise<Coordinates> {
    if (config.apiKeys?.googleMaps) {
      try {
        return await this.getCoordinatesFromGoogleMaps(address);
      } catch (error) {
        this.logger.warn('Google Maps geocoding failed, using state fallback:', error);
      }
    }

    return this.estimateCoordinatesFromBrazilianAddress(address);
  }

  private async getCoordinatesFromGoogleMaps(address: Address): Promise<Coordinates> {
    try {
      const addressParts = [];
      
      if (address.logradouro) {
        addressParts.push(address.logradouro);
      }
      if (address.bairro) {
        addressParts.push(address.bairro);
      }
      addressParts.push(address.localidade);
      addressParts.push(address.uf);
      addressParts.push('Brazil');

      const addressString = addressParts.join(', ');
      
      this.logger.info(`Google Maps Geocoding query: ${addressString}`);

      const response: AxiosResponse<GoogleMapsGeocodingResponse> = await retryWithBackoff(
        () => this.googleMapsClient.get('/json', {
          params: {
            address: addressString,
            key: config.apiKeys?.googleMaps,
            region: 'br',
            language: 'pt-BR'
          }
        }),
        3,
        1000
      );

      const data = response.data;

      if (data.status !== 'OK' || data.results.length === 0) {
        throw new Error(`Google Maps geocoding failed: ${data.status}`);
      }

      const result = data.results[0];
      const coordinates = {
        latitude: Number(result.geometry.location.lat.toFixed(6)),
        longitude: Number(result.geometry.location.lng.toFixed(6)),
      };

      this.logger.info(`Google Maps geocoding successful: ${coordinates.latitude}, ${coordinates.longitude}`);
      return coordinates;
    } catch (error) {
      this.logger.error('Google Maps geocoding error:', error);
      throw error;
    }
  }

  private estimateCoordinatesFromBrazilianAddress(address: Address): Coordinates {
    const stateCoordinates: Record<string, Coordinates> = {
      'AC': { latitude: -9.0238, longitude: -70.8120 },
      'AL': { latitude: -9.5713, longitude: -36.7819 },
      'AP': { latitude: 0.0389, longitude: -51.0964 },
      'AM': { latitude: -3.1190, longitude: -60.0217 },
      'BA': { latitude: -12.9704, longitude: -38.5124 },
      'CE': { latitude: -3.7304, longitude: -38.5267 },
      'DF': { latitude: -15.8267, longitude: -47.9218 },
      'ES': { latitude: -20.3155, longitude: -40.3128 },
      'GO': { latitude: -16.6869, longitude: -49.2648 },
      'MA': { latitude: -2.5387, longitude: -44.2825 },
      'MT': { latitude: -15.6014, longitude: -56.0979 },
      'MS': { latitude: -20.4697, longitude: -54.6201 },
      'MG': { latitude: -19.8157, longitude: -43.9542 },
      'PA': { latitude: -1.4554, longitude: -48.4898 },
      'PB': { latitude: -7.1195, longitude: -34.8450 },
      'PR': { latitude: -25.4284, longitude: -49.2733 },
      'PE': { latitude: -8.0476, longitude: -34.8770 },
      'PI': { latitude: -5.0892, longitude: -42.8019 },
      'RJ': { latitude: -22.9068, longitude: -43.1729 },
      'RN': { latitude: -5.7945, longitude: -35.2110 },
      'RS': { latitude: -30.0346, longitude: -51.2177 },
      'RO': { latitude: -8.7619, longitude: -63.9039 },
      'RR': { latitude: 2.8235, longitude: -60.6758 },
      'SC': { latitude: -27.5954, longitude: -48.5480 },
      'SP': { latitude: -23.5505, longitude: -46.6333 },
      'SE': { latitude: -10.9472, longitude: -37.0731 },
      'TO': { latitude: -10.1753, longitude: -48.2982 },
    };

    const stateCoords = stateCoordinates[address.uf];
    if (stateCoords) {
      const latVariation = (Math.random() - 0.5) * 0.1;
      const lngVariation = (Math.random() - 0.5) * 0.1;
      
      return {
        latitude: Number((stateCoords.latitude + latVariation).toFixed(6)),
        longitude: Number((stateCoords.longitude + lngVariation).toFixed(6)),
      };
    }

    return {
      latitude: -14.2350,
      longitude: -51.9253,
    };
  }

  async isViaCepAvailable(): Promise<boolean> {
    try {
      const response = await this.viaCepClient.get('/01310-100/json/', { timeout: 3000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export default new GeocodingService();
