import { DomainError } from "@src/shared/domain/domainError";

export class UserAlreadyExistsError extends DomainError {
    constructor(username: string) {
        super(`User with username '${username}' already exists.`);
    }
}
