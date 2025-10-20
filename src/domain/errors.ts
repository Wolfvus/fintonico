export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {}

export class NotFoundError extends DomainError {}

export class DuplicateError extends DomainError {}

export class UnbalancedEntryError extends DomainError {}

export class DirectionError extends DomainError {}

export class BaseCurrencyError extends DomainError {}

export class FxMissingError extends DomainError {}

export class CurrencyMismatchError extends DomainError {}

export class IdempotencyError extends DomainError {}
