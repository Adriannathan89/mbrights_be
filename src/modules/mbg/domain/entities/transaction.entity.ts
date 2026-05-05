import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum TransactionStatus {
    DRAFT = 'DRAFT',
    RELEASED = 'RELEASED',
    COMMIT_PENDING = 'COMMIT_PENDING',
    COMMITTED = 'COMMITTED',
    COMMIT_FAILED = 'COMMIT_FAILED',
}

export enum TransactionType {
    EXPENSE = 'EXPENSE',
    INCOME = 'INCOME',
    TRANSFER = 'TRANSFER',
}

@Entity({ name: 'vendor_transactions' })
export class VendorTransaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'vendor_id' })
    vendorId!: string;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.DRAFT,
    })
    status!: TransactionStatus;

    @Column({ type: 'enum', enum: TransactionType })
    type!: TransactionType;

    @Column({ type: 'numeric' })
    amount!: string;

    @Column()
    currency!: string;

    @Column({ name: 'occurred_at', type: 'timestamp' })
    occurredAt!: Date;

    @Column({ nullable: true })
    description?: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown> | null;

    @Column({ name: 'released_at', type: 'timestamp', nullable: true })
    releasedAt?: Date | null;

    @Column({ name: 'released_by_user_id', nullable: true })
    releasedByUserId?: string | null;

    @Column({ name: 'commit_requested_at', type: 'timestamp', nullable: true })
    commitRequestedAt?: Date | null;

    @Column({ name: 'committed_at', type: 'timestamp', nullable: true })
    committedAt?: Date | null;

    @Column({ name: 'payload_hash', nullable: true })
    payloadHash?: string | null;

    @Column({ name: 'chain_info', type: 'jsonb', nullable: true })
    chain?: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
