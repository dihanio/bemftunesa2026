import { BaseImsApiService } from '../lib/api/client';
import { LettersResponse, LetterData } from '../types/letter';
import { LettersResponseDTO, LetterDTO } from '../core/letters/letter.dto';
import { mapLetterDtoToDomain } from '../core/letters/letter.mapper';

export class LetterService {
  /**
   * Fetch recent letters.
   */
  static async getRecentLetters(limit: number = 5): Promise<LettersResponse> {
    const response = await BaseImsApiService.get<LettersResponseDTO>(`/letters?limit=${limit}`);
    
    return {
      data: response.data.data.map(mapLetterDtoToDomain),
      total: response.data.data.length
    };
  }

  /**
   * Fetch letters with optional filters.
   */
  static async getLetters(type?: string, status?: string): Promise<LettersResponse> {
    let url = '/letters';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    const queryStr = params.toString();
    if (queryStr) url += `?${queryStr}`;

    const response = await BaseImsApiService.get<LettersResponseDTO>(url);
    
    return {
      data: response.data.data.map(mapLetterDtoToDomain),
      total: response.data.data.length
    };
  }

  /**
   * Fetch smart priority letters (DSS).
   */
  static async getSmartPriorityLetters(): Promise<LetterData[]> {
    const response = await BaseImsApiService.get<{ data: { letter: LetterDTO; score: number }[] }>('/surat/smart-priority');
    
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map(item => {
        const domain = mapLetterDtoToDomain(item.letter);
        domain.smartScore = item.score;
        return domain;
      });
    }
    return [];
  }

  /**
   * Create a new letter.
   */
  static async createLetter(data: Partial<LetterData>): Promise<void> {
    await BaseImsApiService.post('/letters', data);
  }

  /**
   * Update an existing letter.
   */
  static async updateLetter(id: string, data: Partial<LetterData>): Promise<void> {
    await BaseImsApiService.patch(`/letters/${id}`, data);
  }

  /**
   * Delete a letter.
   */
  static async deleteLetter(id: string): Promise<void> {
    await BaseImsApiService.delete(`/letters/${id}`);
  }
}
