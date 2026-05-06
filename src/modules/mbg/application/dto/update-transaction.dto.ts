import { TransactionType } from '../../domain/entities/transaction.entity';

export class UpdateTransactionDto {
    type?: TransactionType;
    amount?: string;
    currency?: string;
    occurredAt?: string;
    description?: string;
    metadata?: Record<string, unknown>;
}
