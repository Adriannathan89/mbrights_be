import { BaseEntity } from '@src/shared/domain/base.entity';
import { Result } from '@src/shared/domain/result';
import { randomUUID } from 'crypto';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export interface SessionProps {
    userId: string;
    ipAddress: string;
    refreshToken: string;
    expiresAt: Date;
}

@Entity({ name: 'sessions' })
export class Session extends BaseEntity<string> implements SessionProps {
    constructor(
        id: string,
        props: SessionProps = {
            userId: '',
            ipAddress: '',
            refreshToken: '',
            expiresAt: new Date(),
        },
    ) {
        super(id);
        this.id = id;
        this.userId = props.userId;
        this.ipAddress = props.ipAddress;
        this.refreshToken = props.refreshToken;
        this.expiresAt = props.expiresAt;
    }
    @PrimaryColumn({ name: 'id' })
    readonly id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'ip_address' })
    ipAddress: string;

    @Column({ name: 'refresh_token' })
    refreshToken: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    public static create(props: SessionProps): Result<Session> {
        const id = randomUUID();
        return Result.ok(new Session(id, props));
    }

    public static reconstruct(id: string, props: SessionProps): Session {
        return new Session(id, props);
    }
}
