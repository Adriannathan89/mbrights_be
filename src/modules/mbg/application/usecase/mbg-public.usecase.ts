import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    TransactionStatus,
    VendorTransaction,
} from '../../domain/entities/transaction.entity';
import { Vendor } from '../../domain/entities/vendor.entity';

export class MbgPublicUseCase {
    constructor(
        @InjectRepository(Vendor)
        private readonly vendorRepository: Repository<Vendor>,
        @InjectRepository(VendorTransaction)
        private readonly txRepository: Repository<VendorTransaction>,
    ) {}

    async publicTx(q: Record<string, string>) {
        const page = Number(q.page ?? 1);
        const pageSize = Math.min(Number(q.pageSize ?? 20), 100);
        const where: Record<string, unknown> = {
            status: TransactionStatus.COMMITTED,
        };
        if (q.vendorId) where.vendorId = q.vendorId;
        const [items, total] = await this.txRepository.findAndCount({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { committedAt: 'DESC' },
        });
        return { items, total, page, pageSize };
    }

    async publicTxDetail(transactionId: string) {
        const tx = await this.txRepository.findOne({
            where: { id: transactionId, status: TransactionStatus.COMMITTED },
        });
        if (!tx) throw new NotFoundException('Transaction not found');
        return tx;
    }

    async publicVendors(page = 1, pageSize = 20) {
        const [items, total] = await this.vendorRepository.findAndCount({
            select: { id: true, name: true },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
        });
        return { items, total, page: Number(page), pageSize: Number(pageSize) };
    }

    async vendorSummary(vendorId: string) {
        await this.mustVendor(vendorId);
        const committed = await this.txRepository.find({
            where: { vendorId, status: TransactionStatus.COMMITTED },
            order: { committedAt: 'ASC' },
        });
        return {
            vendorId,
            committedTransactionCount: committed.length,
            firstCommittedAt: committed[0]?.committedAt ?? null,
            lastCommittedAt: committed[committed.length - 1]?.committedAt ?? null,
        };
    }

    private async mustVendor(vendorId: string) {
        const vendor = await this.vendorRepository.findOne({
            where: { id: vendorId },
        });
        if (!vendor) throw new NotFoundException('Vendor not found');
        return vendor;
    }
}
