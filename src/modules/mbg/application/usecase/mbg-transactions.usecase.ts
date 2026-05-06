import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { In, Repository } from 'typeorm';

import { MbgAuthzService } from '../mbg-authz.service';
import { CommitBatchDto } from '../dto/commit-batch.dto';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { CommitIdempotencyKey } from '../../domain/entities/commit-idempotency.entity';
import {
    TransactionStatus,
    VendorTransaction,
} from '../../domain/entities/transaction.entity';
import { VendorScopedRole } from '../../domain/entities/vendor-membership.entity';

export class MbgTransactionsUseCase {
    constructor(
        @InjectRepository(VendorTransaction)
        private readonly txRepository: Repository<VendorTransaction>,
        @InjectRepository(CommitIdempotencyKey)
        private readonly idemRepository: Repository<CommitIdempotencyKey>,
        private readonly authzService: MbgAuthzService,
    ) {}

    async createTx(
        userId: string | undefined,
        vendorId: string,
        input: CreateTransactionDto,
    ) {
        await this.assertVendorMember(userId, vendorId);
        const tx = this.txRepository.create({
            ...input,
            vendorId,
            occurredAt: new Date(input.occurredAt),
            status: TransactionStatus.DRAFT,
        });
        return this.txRepository.save(tx);
    }

    async listTx(
        userId: string | undefined,
        vendorId: string,
        q: Record<string, string>,
    ) {
        await this.assertVendorAccess(userId, vendorId);
        const where: Record<string, unknown> = { vendorId };
        if (q.status) where.status = q.status;
        const page = Number(q.page ?? 1);
        const pageSize = Math.min(Number(q.pageSize ?? 20), 100);
        const [items, total] = await this.txRepository.findAndCount({
            where,
            order: { occurredAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total, page, pageSize };
    }

    async getTx(
        userId: string | undefined,
        vendorId: string,
        transactionId: string,
    ) {
        await this.assertVendorAccess(userId, vendorId);
        return this.mustTx(vendorId, transactionId);
    }

    async updateTx(
        userId: string | undefined,
        vendorId: string,
        transactionId: string,
        input: UpdateTransactionDto,
    ) {
        await this.assertVendorMember(userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.DRAFT) {
            throw new BadRequestException('Only draft transaction can be updated');
        }
        if (input.occurredAt) tx.occurredAt = new Date(input.occurredAt);
        Object.assign(tx, input);
        return this.txRepository.save(tx);
    }

    async deleteTx(
        userId: string | undefined,
        vendorId: string,
        transactionId: string,
    ) {
        await this.assertVendorAdmin(userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.DRAFT) {
            throw new BadRequestException('Only draft transaction can be deleted');
        }
        await this.txRepository.remove(tx);
    }

    async releaseTx(
        userId: string | undefined,
        vendorId: string,
        transactionId: string,
    ) {
        await this.assertVendorAdmin(userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.DRAFT) {
            throw new BadRequestException('Only draft transaction can be released');
        }
        tx.status = TransactionStatus.RELEASED;
        tx.releasedAt = new Date();
        tx.releasedByUserId = userId;
        return this.txRepository.save(tx);
    }

    async commitTx(
        userId: string | undefined,
        vendorId: string,
        transactionId: string,
        idempotencyKey?: string,
    ) {
        await this.assertVendorAdmin(userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.RELEASED) {
            throw new BadRequestException('TRANSACTION_NOT_RELEASED');
        }
        if (idempotencyKey) {
            const existing = await this.idemRepository.findOne({
                where: { idempotencyKey },
            });
            if (existing && existing.transactionId !== tx.id) {
                throw new BadRequestException('IDEMPOTENCY_REPLAY_CONFLICT');
            }
            if (!existing) {
                await this.idemRepository.save(
                    this.idemRepository.create({
                        idempotencyKey,
                        transactionId: tx.id,
                    }),
                );
            }
        }

        tx.status = TransactionStatus.COMMIT_PENDING;
        tx.commitRequestedAt = new Date();
        tx.payloadHash = this.computePayloadHash(tx);
        await this.txRepository.save(tx);
        return {
            transactionId: tx.id,
            status: TransactionStatus.COMMIT_PENDING,
        };
    }

    async commitBatch(
        userId: string | undefined,
        vendorId: string,
        input: CommitBatchDto,
    ) {
        await this.assertVendorAdmin(userId, vendorId);
        const txs = await this.txRepository.findBy({ id: In(input.transactionIds) });
        const updated: string[] = [];
        for (const tx of txs) {
            if (
                tx.vendorId === vendorId &&
                tx.status === TransactionStatus.RELEASED
            ) {
                tx.status = TransactionStatus.COMMIT_PENDING;
                tx.commitRequestedAt = new Date();
                tx.payloadHash = this.computePayloadHash(tx);
                await this.txRepository.save(tx);
                updated.push(tx.id);
            }
        }
        return { accepted: updated };
    }

    private async mustTx(vendorId: string, transactionId: string) {
        const tx = await this.txRepository.findOne({
            where: { id: transactionId, vendorId },
        });
        if (!tx) throw new NotFoundException('Transaction not found');
        return tx;
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

    private async assertVendorMember(
        userId: string | undefined,
        vendorId: string,
    ) {
        if (!userId) throw new UnauthorizedException();
        const role = await this.authzService.getVendorRole(vendorId, userId);
        if (!role || role === VendorScopedRole.AUDITOR) {
            throw new ForbiddenException();
        }
    }

    private computePayloadHash(tx: VendorTransaction): string {
        const serialized = JSON.stringify({
            id: tx.id,
            vendorId: tx.vendorId,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency,
            occurredAt: tx.occurredAt.toISOString(),
            description: tx.description ?? null,
            metadata: tx.metadata ?? null,
        });
        return `0x${createHash('sha256').update(serialized).digest('hex')}`;
    }
}
