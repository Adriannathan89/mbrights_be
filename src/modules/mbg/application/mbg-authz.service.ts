import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@src/modules/user/domain/entities/user_role.entity';
import { Repository } from 'typeorm';

import {
    VendorMembership,
    VendorScopedRole,
} from '../domain/entities/vendor-membership.entity';

@Injectable()
export class MbgAuthzService {
    constructor(
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
        @InjectRepository(VendorMembership)
        private readonly membershipRepository: Repository<VendorMembership>,
    ) {}

    async isPlatformAdmin(userId: string): Promise<boolean> {
        const userRoles = await this.userRoleRepository.find({
            where: { userId },
            relations: ['role'],
        });

        const names = userRoles.map((ur) => ur.role?.roleName).filter(Boolean);
        return names.some((name) =>
            ['PLATFORM_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(String(name)),
        );
    }

    async getVendorRole(
        vendorId: string,
        userId: string,
    ): Promise<VendorScopedRole | null> {
        const membership = await this.membershipRepository.findOne({
            where: { vendorId, userId },
        });
        return membership?.role ?? null;
    }
}
