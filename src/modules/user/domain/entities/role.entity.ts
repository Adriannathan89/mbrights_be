import { BaseEntity } from '@src/shared/domain/base.entity';
import { randomUUID } from 'crypto';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { UserRole } from './user_role.entity';

export enum RoleEnum {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface RoleProps {
    roleName: RoleEnum;
}

@Entity({ name: 'roles' })
export class Role extends BaseEntity<string> implements RoleProps {
    constructor(props: RoleProps = { roleName: RoleEnum.USER }) {
        const id = randomUUID();
        super(id);
        this.id = id;
        this.roleName = props.roleName;
    }

    @PrimaryColumn({ name: 'id' })
    id: string;

    @Column({ type: 'enum', enum: RoleEnum, name: 'role_name', unique: true })
    roleName: RoleEnum;

    @OneToMany(() => UserRole, (userRole) => userRole.role)
    userRoles?: UserRole[];
}
