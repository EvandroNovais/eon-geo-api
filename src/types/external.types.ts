export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface OpenCageResponse {
  results: Array<{
    components: {
      country: string;
      country_code: string;
      state: string;
      city: string;
      postcode: string;
      road?: string;
      suburb?: string;
    };
    formatted: string;
    geometry: {
      lat: number;
      lng: number;
    };
    confidence: number;
  }>;
  status: {
    code: number;
    message: string;
  };
  total_results: number;
}

export interface GoogleMapsGeocodingResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

export interface GoogleMapsDistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance?: {
        text: string;
        value: number; // distance in meters
      };
      duration?: {
        text: string;
        value: number; // duration in seconds
      };
      status: string; // OK, NOT_FOUND, ZERO_RESULTS
    }>;
  }>;
  status: string; // OK, INVALID_REQUEST, MAX_ELEMENTS_EXCEEDED, etc.
}

export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}