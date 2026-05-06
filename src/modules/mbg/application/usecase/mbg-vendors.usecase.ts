import {
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@src/modules/user/domain/entities/user.entity';
import { Repository } from 'typeorm';

import { MbgAuthzService } from '../mbg-authz.service';
import { AssignVendorUserDto } from '../dto/assign-vendor-user.dto';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { Vendor } from '../../domain/entities/vendor.entity';
import {
    VendorMembership,
    VendorScopedRole,
} from '../../domain/entities/vendor-membership.entity';

export class MbgVendorsUseCase {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Vendor)
        private readonly vendorRepository: Repository<Vendor>,
        @InjectRepository(VendorMembership)
        private readonly membershipRepository: Repository<VendorMembership>,
        private readonly authzService: MbgAuthzService,
    ) {}

    async listVendors(page = 1, pageSize = 20) {
        const [items, total] = await this.vendorRepository.findAndCount({
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
            order: { createdAt: 'DESC' },
        });
        return { items, total, page: Number(page), pageSize: Number(pageSize) };
    }

    async createVendor(input: CreateVendorDto) {
        const vendor = this.vendorRepository.create(input);
        return this.vendorRepository.save(vendor);
    }

    async getVendor(userId: string | undefined, vendorId: string) {
        await this.assertVendorAccess(userId, vendorId);
        return this.mustVendor(vendorId);
    }

    async updateVendor(
        userId: string | undefined,
        vendorId: string,
        input: UpdateVendorDto,
    ) {
        await this.assertVendorAdmin(userId, vendorId);
        const vendor = await this.mustVendor(vendorId);
        Object.assign(vendor, input);
        return this.vendorRepository.save(vendor);
    }

    async listVendorUsers(userId: string | undefined, vendorId: string) {
        await this.assertVendorAdmin(userId, vendorId);
        return this.membershipRepository.find({ where: { vendorId } });
    }

    async assignVendorUser(
        userId: string | undefined,
        vendorId: string,
        input: AssignVendorUserDto,
    ) {
        await this.assertVendorAdmin(userId, vendorId);
        await this.mustVendor(vendorId);
        const user = await this.userRepository.findOne({
            where: { id: input.userId },
        });
        if (!user) throw new NotFoundException('User not found');

        let membership = await this.membershipRepository.findOne({
            where: { vendorId, userId: input.userId },
        });
        if (!membership) {
            membership = this.membershipRepository.create({
                vendorId,
                userId: input.userId,
                role: input.role,
            });
        } else {
            membership.role = input.role;
        }
        return this.membershipRepository.save(membership);
    }

    async unassignVendorUser(
        userId: string | undefined,
        vendorId: string,
        memberUserId: string,
    ) {
        await this.assertVendorAdmin(userId, vendorId);
        const membership = await this.membershipRepository.findOne({
            where: { vendorId, userId: memberUserId },
        });
        if (!membership) throw new NotFoundException('Assignment not found');
        await this.membershipRepository.remove(membership);
    }

    private async mustVendor(vendorId: string) {
        const vendor = await this.vendorRepository.findOne({
            where: { id: vendorId },
        });
        if (!vendor) throw new NotFoundException('Vendor not found');
        return vendor;
    }

    private async assertVendorAccess(
        userId: string | undefined,
        vendorId: string,
    ) {
        if (!userId) throw new UnauthorizedException();
        const role = await this.authzService.getVendorRole(vendorId, userId);
        if (!role) throw new ForbiddenException();
    }

    private async assertVendorAdmin(
        userId: string | undefined,
        vendorId: string,
    ) {
        if (!userId) throw new UnauthorizedException();
        const role = await this.authzService.getVendorRole(vendorId, userId);
        if (role !== VendorScopedRole.VENDOR_ADMIN) {
            throw new ForbiddenException();
        }
    }
}
