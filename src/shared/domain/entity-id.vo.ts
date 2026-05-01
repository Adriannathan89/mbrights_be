export class EntityId {
    private constructor(public readonly value: string) {}

    static create(value: string): EntityId {
        if (!value) {
            throw new Error('EntityId cannot be empty.');
        }
        return new EntityId(value);
    }

    getValue(): string {
        return this.value;
    }
}
