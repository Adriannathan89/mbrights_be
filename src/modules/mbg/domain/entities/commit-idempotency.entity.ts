import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'commit_idempotency_keys' })
export class CommitIdempotencyKey {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'transaction_id' })
    transactionId!: string;

    @Column({ name: 'idempotency_key', length: 128, unique: true })
    idempotencyKey!: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;
}
