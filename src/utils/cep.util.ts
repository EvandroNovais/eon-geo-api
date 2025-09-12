/**
 * Utilities for CEP validation and formatting
 */

/**
 * Validates if a CEP follows the Brazilian format
 * @param cep - The CEP string to validate
 * @returns boolean indicating if CEP is valid
 */
export function isValidCep(cep: string): boolean {
  if (!cep) return false;
  
  // Remove any non-numeric characters
  const cleanCep = cep.replace(/\D/g, '');
  
  // Check if it has exactly 8 digits
  if (cleanCep.length !== 8) return false;
  
  // Check if it's not all the same digit (e.g., 00000000, 11111111)
  if (/^(\d)\1{7}$/.test(cleanCep)) return false;
  
  return true;
}

/**
 * Formats a CEP string by removing non-numeric characters
 * @param cep - The CEP string to format
 * @returns Formatted CEP string with only numbers
 */
export function formatCep(cep: string): string {
  if (!cep) return '';
  return cep.replace(/\D/g, '');
}

/**
 * Formats a CEP string with hyphen (e.g., 12345-678)
 * @param cep - The CEP string to format
 * @returns Formatted CEP string with hyphen
 */
export function formatCepWithHyphen(cep: string): string {
  const cleanCep = formatCep(cep);
  if (cleanCep.length !== 8) return cleanCep;
  return `${cleanCep.substring(0, 5)}-${cleanCep.substring(5)}`;
}

/**
 * Validates if a CEP exists and throws appropriate error
 * @param cep - The CEP string to validate
 * @throws Error with specific message if CEP is invalid
 */
export function validateCepOrThrow(cep: string): void {
  if (!cep) {
    throw new Error('CEP is required');
  }
  
  if (!isValidCep(cep)) {
    throw new Error('CEP format is invalid. CEP must contain 8 digits');
  }
}