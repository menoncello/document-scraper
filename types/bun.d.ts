// Type declarations for Bun built-in modules
declare module 'bun:test' {
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function describe(name: string, fn: () => void): void;
  export function expect(value: any): {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toHaveLength(length: number): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(expected: any): void;
    toMatch(pattern: RegExp | string): void;
    toThrow(): void;
    toThrowError(): void;
    not: {
      toBe(expected: any): void;
      toEqual(expected: any): void;
      toHaveLength(length: number): void;
      toBeDefined(): void;
      toBeUndefined(): void;
      toBeNull(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toContain(expected: any): void;
      toMatch(pattern: RegExp | string): void;
      toThrow(): void;
      toThrowError(): void;
    };
  };
}