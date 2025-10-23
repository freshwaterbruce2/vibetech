/**
 * Auto-Fix System Test File
 * Tests various error types and severities
 * Date: October 20, 2025
 */

// ============================================
// SIMPLE ERRORS (Should use Claude Haiku 4.5)
// ============================================

// Error 1: TS2304 - Cannot find name (simple typo)
const message = "Hello, World\!";
console.log(mesage); // Typo: 'mesage' should be 'message'

// Error 2: TS2554 - Expected 2 arguments, but got 1
function add(a: number, b: number): number {
  return a + b;
}
const result = add(5); // Missing second argument

// Error 3: TS2339 - Property does not exist (typo)
const user = {
  name: "Alice",
  age: 30
};
console.log(user.nam); // Typo: 'nam' should be 'name'

// ============================================
// MEDIUM COMPLEXITY ERRORS (Haiku or Sonnet)
// ============================================

// Error 5: TS2322 - Type mismatch
interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: "Bob",
  age: "thirty" // Should be number, not string
};

// Error 6: TS2345 - Argument type mismatch
function greet(name: string): void {
  console.log();
}
greet(123); // Should be string, not number

// ============================================
// COMPLEX ERRORS (Should use Claude Sonnet 4.5)
// ============================================

// Error 8: Complex type inference issue
class DataService<T> {
  private data: T[] = [];

  add(item: T): void {
    this.data.push(item);
  }

  get(index: number): T | undefined {
    return this.data[index];
  }
}

const service = new DataService<number>();
service.add("string"); // Type error: should be number

export {};
