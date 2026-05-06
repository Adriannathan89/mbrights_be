import {
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChainConfirmedDto } from '../dto/chain-confirmed.dto';
import {
    TransactionStatus,
    VendorTransaction,
} from '../../domain/entities/transaction.entity';

export class MbgInternalUseCase {
    constructor(
        @InjectRepository(VendorTransaction)
        private readonly txRepository: Repository<VendorTransaction>,
    ) {}

    async chainConfirmed(secret: string, input: ChainConfirmedDto) {
        if (
            !process.env.INTERNAL_WEBHOOK_SECRET ||
            secret !== process.env.INTERNAL_WEBHOOK_SECRET
        ) {
            throw new UnauthorizedException();
        }
        const tx = await this.txRepository.findOne({
            where: { id: input.transactionId },
        });
        if (!tx) throw new NotFoundException('Transaction not found');
        tx.status = TransactionStatus.COMMITTED;
        tx.committedAt = new Date();
        tx.chain = {
            txHash: input.txHash,
            blockNumber: input.blockNumber,
            chainId: input.chainId ?? Number(process.env.CHAIN_ID ?? 11155111),
        };
        await this.txRepository.save(tx);
        return { ok: true };
    }
}
