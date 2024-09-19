export const CATEGORIES = [
    'groceries',
    'dining_out',
    'utilities',
    'transportation',
    'entertainment',
    'healthcare',
    'shopping',
    'housing',
    'education',
    'miscellaneous',
] as const;

export enum ErrorCodes {
    UNIQUE_VIOLATION = '23505', // Unique constraint violation
    FOREIGN_KEY_VIOLATION = '23503', // Foreign key violation
    NOT_NULL_VIOLATION = '23502', // Not-null violation
}