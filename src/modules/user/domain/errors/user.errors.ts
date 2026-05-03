import { DomainError } from '@src/shared/domain/domainError';

export class UserAlreadyExistsError extends DomainError {
    constructor(username: string) {
        super(`User with username '${username}' already exists.`);
    }
}

export class UserNotFoundError extends DomainError {
    constructor(id: string) {
        super(`User with id '${id}' not found.`);
    }
}

export class MissingUserRoleError extends DomainError {
    constructor() {
        super(`Default USER role not found.`);
    }
}
