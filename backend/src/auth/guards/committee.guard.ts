import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { COMMITTEE_ROLES_KEY } from '../decorators/committee.decorator';
import { Proker, Committee } from '../../database/schema/proker';

@Injectable()
export class CommitteeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Proker.name) private prokerModel: Model<Proker>,
    @InjectModel(Committee.name) private committeeModel: Model<Committee>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      COMMITTEE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Autentikasi diperlukan');
    }

    // KaBEM (and Super Admin in development/admin contexts) has absolute bypass access for everything
    if (user.role === 'Super Admin' || user.role === 'KaBEM') {
      return true;
    }

    // WaKaBEM has global supervisor / SC bypass for all prokers
    if (user.role === 'WaKaBEM') {
      return true;
    }

    // Global Sekretaris & Bendahara BEM have bypass for global financial & administrative oversight
    if (user.role === 'Sekretaris' || user.role === 'Bendahara') {
      return true;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Retrieve prokerId from request parameter, body, or query
    const prokerId =
      request.params.prokerId ||
      request.params.id ||
      request.body.prokerId ||
      request.query.prokerId;

    if (!prokerId) {
      console.warn('[CommitteeGuard] No prokerId found in request context.');
      throw new ForbiddenException(
        'Konteks Program Kerja (prokerId) tidak ditemukan',
      );
    }

    // Fetch the target proker to perform department and SC checking
    const proker = await this.prokerModel.findById(prokerId);
    if (!proker) {
      throw new ForbiddenException('Program kerja tidak ditemukan');
    }

    // Automated SC / Owner check for Kadep & Wakadep of the organizing department
    if (user.role === 'Kadep' || user.role === 'Wakadep') {
      const isOrganizingDept =
        proker.departmentId.toString() === user.department?.toString();
      if (isOrganizingDept) {
        // Automatically mapped as Steering Committee (SC) / Department Supervisor
        return true;
      }
    }

    // Look up dynamic Kepanitiaan Pelaksana (OC) role in the database
    const panitia = await this.committeeModel.findOne({
      userId: user.userId,
      prokerId,
      deletedAt: null,
    });

    if (!panitia) {
      console.warn(
        `[CommitteeGuard] User ${user.email} is not a registered committee member of proker: ${prokerId}`,
      );
      throw new ForbiddenException(
        'Anda tidak terdaftar dalam kepanitiaan program kerja ini',
      );
    }

    const hasRequiredPosition = requiredRoles.includes(panitia.position || '');
    if (!hasRequiredPosition) {
      console.warn(
        `[CommitteeGuard] User ${user.email} has role ${panitia.position} but requires one of: ${requiredRoles}`,
      );
      throw new ForbiddenException(
        `Akses terbatas! Anda terdaftar sebagai ${panitia.position}, membutuhkan posisi: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
