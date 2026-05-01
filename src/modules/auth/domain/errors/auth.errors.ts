import { DomainError } from '@src/shared/domain/domainError';

export class InvalidCredentialsError extends DomainError {
    constructor() {
        super('Invalid username or password.');
    }
}

export class RefreshTokenNotFoundError extends DomainError {
    constructor() {
        super('Refresh token not found. Please log in again.');
    }
}

export class RefreshTokenExpiredError extends DomainError {
    constructor() {
        super('Refresh token has expired. Please log in again.');
    }
}
