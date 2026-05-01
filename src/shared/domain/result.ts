export class Result<T, E = Error> {
    private constructor(
        public readonly isSuccess: boolean,
        public readonly value?: T,
        public readonly error?: E,
    ) {}

    static ok<T>(value: T): Result<T> {
        return new Result<T, never>(true, value);
    }

    static fail<E>(error: E): Result<never, E> {
        return new Result<never, E>(false, undefined, error);
    }

    isOk(): this is { value: T } {
        return this.isSuccess;
    }

    isFailure(): this is { error: E } {
        return !this.isSuccess;
    }

    getValue(): T {
        if (!this.isSuccess) {
            throw new Error('Cannot get the value of an error result.');
        }
        return this.value as T;
    }

    getError(): E {
        if (this.isSuccess) {
            throw new Error('Cannot get the error of a success result.');
        }
        return this.error as E;
    }
}
