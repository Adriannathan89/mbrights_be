export abstract class BaseEntity<TId> {
    constructor(public readonly id: TId) {}

    equals(other: BaseEntity<TId>): boolean {
        if (!other) return false;
        return this.id === other.id;
    }
}
