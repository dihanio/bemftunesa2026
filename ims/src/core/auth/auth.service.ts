import { BaseImsApiService } from '../../lib/api/client';
import { UserProfileDTO } from './auth.dto';
import { UserProfileBase } from '../../types/rbac';
import { mapProfileDtoToDomain } from './auth.mapper';

export class AuthService {
  static async getProfile(): Promise<UserProfileBase> {
    const response = await BaseImsApiService.get<UserProfileDTO>('/auth/me');
    return mapProfileDtoToDomain(response.data);
  }
}
