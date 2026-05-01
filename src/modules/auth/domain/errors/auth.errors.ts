import { DomainError } from '@src/shared/domain/domainError';

export class InvalidCredentialsError extends DomainError {
    constructor() {
        super('Invalid username or password.');
    }
}