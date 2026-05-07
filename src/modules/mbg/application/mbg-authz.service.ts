import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    VendorMembership,
    VendorScopedRole,
} from '../domain/entities/vendor-membership.entity';

@Injectable()
export class MbgAuthzService {
    constructor(
        @InjectRepository(VendorMembership)
        private readonly membershipRepository: Repository<VendorMembership>,
    ) {}

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
