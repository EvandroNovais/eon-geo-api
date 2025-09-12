import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { GeocodingResult, Coordinates, Address, ErrorCodes } from '../types/api.types';
import { ViaCepResponse, OpenCageResponse } from '../types/external.types';
import { formatCep, validateCepOrThrow } from '../utils/cep.util';
import { retryWithBackoff } from '../utils/response.util';
import cacheService from './cache.service';
import config from '../config';
import winston from 'winston';

class GeocodingService {
  private viaCepClient: AxiosInstance;
  private openCageClient: AxiosInstance;
  private logger: winston.Logger;

  constructor() {
    this.viaCepClient = axios.create({
      baseURL: 'https://viacep.com.br/ws',
      timeout: 5000,
    });

    this.openCageClient = axios.create({
      baseURL: 'https://api.opencagedata.com/geocode/v1',
      timeout: 5000,
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

    // Try to get from cache first
    const cacheKey = cacheService.generateKey('geocoding', cleanCep);
    const cachedResult = await cacheService.get<GeocodingResult>(cacheKey);
    
    if (cachedResult) {
      this.logger.info(`Cache hit for CEP: ${cleanCep}`);
      return cachedResult;
    }

    try {
      // Get address data from ViaCEP
      const addressData = await this.getAddressFromViaCep(cleanCep);
      
      // Get coordinates from external geocoding service
      const coordinates = await this.getCoordinatesFromAddress(addressData);
      
      const result: GeocodingResult = {
        coordinates,
        address: addressData,
      };

      // Cache the result
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
    // Try OpenCage first if API key is available
    if (config.apiKeys?.opencage) {
      try {
        return await this.getCoordinatesFromOpenCage(address);
      } catch (error) {
        this.logger.warn('OpenCage geocoding failed, trying fallback method:', error);
      }
    }

    // Fallback to basic coordinates estimation for Brazilian addresses
    return this.estimateCoordinatesFromBrazilianAddress(address);
  }

  private async getCoordinatesFromOpenCage(address: Address): Promise<Coordinates> {
    try {
      const query = `${address.logradouro}, ${address.bairro}, ${address.localidade}, ${address.uf}, Brazil`;
      
      const response: AxiosResponse<OpenCageResponse> = await this.openCageClient.get('/json', {
        params: {
          q: query,
          key: config.apiKeys?.opencage,
          countrycode: 'br',
          limit: 1,
        },
      });

      const data = response.data;

      if (data.results.length === 0) {
        throw new Error('No results found from OpenCage');
      }

      const result = data.results[0];
      return {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
      };
    } catch (error) {
      this.logger.error('OpenCage geocoding error:', error);
      throw error;
    }
  }

  private estimateCoordinatesFromBrazilianAddress(address: Address): Coordinates {
    // Basic coordinate estimation based on Brazilian state capitals
    // This is a fallback method for when external APIs are not available
    const stateCoordinates: Record<string, Coordinates> = {
      'AC': { latitude: -9.0238, longitude: -70.8120 }, // Rio Branco
      'AL': { latitude: -9.5713, longitude: -36.7819 }, // Maceió
      'AP': { latitude: 0.0389, longitude: -51.0964 }, // Macapá
      'AM': { latitude: -3.1190, longitude: -60.0217 }, // Manaus
      'BA': { latitude: -12.9704, longitude: -38.5124 }, // Salvador
      'CE': { latitude: -3.7304, longitude: -38.5267 }, // Fortaleza
      'DF': { latitude: -15.8267, longitude: -47.9218 }, // Brasília
      'ES': { latitude: -20.3155, longitude: -40.3128 }, // Vitória
      'GO': { latitude: -16.6869, longitude: -49.2648 }, // Goiânia
      'MA': { latitude: -2.5387, longitude: -44.2825 }, // São Luís
      'MT': { latitude: -15.6014, longitude: -56.0979 }, // Cuiabá
      'MS': { latitude: -20.4697, longitude: -54.6201 }, // Campo Grande
      'MG': { latitude: -19.8157, longitude: -43.9542 }, // Belo Horizonte
      'PA': { latitude: -1.4554, longitude: -48.4898 }, // Belém
      'PB': { latitude: -7.1195, longitude: -34.8450 }, // João Pessoa
      'PR': { latitude: -25.4284, longitude: -49.2733 }, // Curitiba
      'PE': { latitude: -8.0476, longitude: -34.8770 }, // Recife
      'PI': { latitude: -5.0892, longitude: -42.8019 }, // Teresina
      'RJ': { latitude: -22.9068, longitude: -43.1729 }, // Rio de Janeiro
      'RN': { latitude: -5.7945, longitude: -35.2110 }, // Natal
      'RS': { latitude: -30.0346, longitude: -51.2177 }, // Porto Alegre
      'RO': { latitude: -8.7619, longitude: -63.9039 }, // Porto Velho
      'RR': { latitude: 2.8235, longitude: -60.6758 }, // Boa Vista
      'SC': { latitude: -27.5954, longitude: -48.5480 }, // Florianópolis
      'SP': { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
      'SE': { latitude: -10.9472, longitude: -37.0731 }, // Aracaju
      'TO': { latitude: -10.1753, longitude: -48.2982 }, // Palmas
    };

    const stateCoords = stateCoordinates[address.uf];
    if (stateCoords) {
      // Add small random variation to avoid all addresses in same state having identical coordinates
      const latVariation = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      const lngVariation = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      
      return {
        latitude: Number((stateCoords.latitude + latVariation).toFixed(6)),
        longitude: Number((stateCoords.longitude + lngVariation).toFixed(6)),
      };
    }

    // Default to center of Brazil if state not found
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