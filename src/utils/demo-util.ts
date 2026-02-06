export function add(a: number, b: number): number {
    if (a == null || b == null) {
        console.warn('add function received null or undefined argument(s)');
    }
    return a + b;
}

export function subtract(a: number, b: number): number {
    return a - b;
}

export function multiply(a: number, b: number): number {
    return a * b;
}