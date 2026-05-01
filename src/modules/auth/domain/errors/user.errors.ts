import { DomainError } from '@src/shared/domain/domainError';

export class InvalidCredentialsError extends DomainError {
    constructor() {
        super('Invalid username or password.');
    }
}

export class UserAlreadyExistsError extends DomainError {
    constructor(username: string) {
        super(`User with username '${username}' already exists.`);
    }
}
