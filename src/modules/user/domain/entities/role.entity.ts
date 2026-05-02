import { BaseEntity } from "@src/shared/domain/base.entity";
import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import { randomUUID } from "crypto";

export enum RoleEnum {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface RoleProps {
    roleName: RoleEnum;
}

@Entity({name: "roles"})
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

    @ManyToMany(() => User, user => user.roles)
    @JoinTable({
        name: 'user_roles',
        joinColumn: {
            name: 'role_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'id'
        }
    })
    users?: User[];
}