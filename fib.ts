const memo = new Map<number, number>();

function fibonacci(n: number): number {
    if (n < 1) return 0;
    if (n <= 2) return 1;
    
    // Check if we have cached the result
    if (memo.has(n)) {
        return memo.get(n)!;
    }
    
    // Calculate and cache the result
    const result = fibonacci(n - 1) + fibonacci(n - 2);
    memo.set(n, result);
    return result;
}

// Test the function
console.log(fibonacci(40));
