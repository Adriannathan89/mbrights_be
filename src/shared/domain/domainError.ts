export class DomainError extends Error {
    protected constructor(message: string) {
        super(message);
    }
}
