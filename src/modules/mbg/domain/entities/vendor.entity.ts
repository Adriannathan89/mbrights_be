import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'vendors' })
export class Vendor {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'name' })
    name!: string;

    @Column({ name: 'external_ref', nullable: true })
    externalRef?: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
