// Auto-Fix Test File - Simple Errors

// Error 1: TS2304 - Cannot find name
const message = "Hello";
console.log(mesage); // Typo: mesage

// Error 2: TS2554 - Missing argument
function add(a: number, b: number) { return a + b; }
const result = add(5);

// Error 3: TS2339 - Property not found
const user = { name: "Alice", age: 30 };
console.log(user.nam); // Typo: nam

// Error 4: TS2322 - Type mismatch
interface Person { name: string; age: number; }
const person: Person = { name: "Bob", age: "thirty" };

// Error 5: TS2345 - Wrong argument type
function greet(name: string) { console.log(name); }
greet(123);

export {};

