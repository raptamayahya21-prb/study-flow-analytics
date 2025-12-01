/**
 * Real Number Mathematics Library
 * 
 * This library implements explicit real number operations and properties
 * following the mathematical axioms of real numbers (R).
 * 
 * Real numbers include all rational and irrational numbers, and possess
 * properties such as:
 * - Closure under addition, subtraction, multiplication, and division
 * - Commutativity: a + b = b + a, a × b = b × a
 * - Associativity: (a + b) + c = a + (b + c)
 * - Distributivity: a × (b + c) = a × b + a × c
 * - Ordering: for any a, b ∈ R, either a < b, a = b, or a > b
 * - Completeness: every non-empty set bounded above has a supremum
 */

export interface RealNumber {
  value: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates and creates a real number
 * Ensures the value is a valid real number (not NaN, not Infinity)
 */
export function createReal(value: number): RealNumber {
  if (isNaN(value)) {
    return { value: 0, isValid: false, errorMessage: "Value is NaN" };
  }
  if (!isFinite(value)) {
    return { value: 0, isValid: false, errorMessage: "Value is Infinity" };
  }
  if (value < 0) {
    return { value: 0, isValid: false, errorMessage: "Negative values not allowed" };
  }
  
  // Fix floating point precision issues
  const fixed = parseFloat(value.toFixed(6));
  return { value: fixed, isValid: true };
}

/**
 * Clamps a real number to a specified range
 * Uses the ordering property of real numbers
 */
export function clampReal(value: number, min: number, max: number): number {
  // Ordering property: min ≤ value ≤ max
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Addition: Demonstrates commutativity
 * Property: a + b = b + a
 */
export function addReal(a: number, b: number): { result: number; commutative: boolean } {
  const sum1 = a + b;
  const sum2 = b + a;
  
  // Verify commutative property (within floating point precision)
  const commutative = Math.abs(sum1 - sum2) < 1e-10;
  
  console.log(`Commutative property: ${a} + ${b} = ${sum1}, ${b} + ${a} = ${sum2}`);
  
  return { result: sum1, commutative };
}

/**
 * Demonstrates associative property of addition
 * Property: (a + b) + c = a + (b + c)
 */
export function associativeAddition(a: number, b: number, c: number): {
  result1: number;
  result2: number;
  associative: boolean;
} {
  const result1 = (a + b) + c;
  const result2 = a + (b + c);
  
  const associative = Math.abs(result1 - result2) < 1e-10;
  
  console.log(`Associative property: (${a} + ${b}) + ${c} = ${result1}`);
  console.log(`                      ${a} + (${b} + ${c}) = ${result2}`);
  
  return { result1, result2, associative };
}

/**
 * Demonstrates distributive property
 * Property: a × (b + c) = a × b + a × c
 */
export function distributiveProperty(a: number, b: number, c: number): {
  result1: number;
  result2: number;
  distributive: boolean;
} {
  const result1 = a * (b + c);
  const result2 = a * b + a * c;
  
  const distributive = Math.abs(result1 - result2) < 1e-10;
  
  console.log(`Distributive property: ${a} × (${b} + ${c}) = ${result1}`);
  console.log(`                        ${a} × ${b} + ${a} × ${c} = ${result2}`);
  
  return { result1, result2, distributive };
}

/**
 * Converts minutes to hours (real number division)
 * Uses the division operation on real numbers
 */
export function minutesToHours(minutes: number): number {
  // Real number division: R / R → R
  const hours = minutes / 60.0;
  return parseFloat(hours.toFixed(4));
}

/**
 * Calculates arithmetic mean (average) of real numbers
 * Uses addition and division operations
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  
  // Sum all values: Σ(xi) for i = 1 to n
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum = sum + values[i]; // Addition operation
  }
  
  // Divide by count: mean = (Σxi) / n
  const mean = sum / values.length;
  
  console.log(`Mean calculation: (${values.join(' + ')}) / ${values.length} = ${mean}`);
  
  return parseFloat(mean.toFixed(4));
}

/**
 * Finds supremum (least upper bound) of a set
 * Uses the completeness axiom of real numbers
 */
export function findSupremum(values: number[]): number {
  if (values.length === 0) return 0;
  
  // Manual iteration to find maximum
  let sup = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] > sup) {
      sup = values[i];
    }
  }
  
  console.log(`Supremum of [${values.join(', ')}] = ${sup}`);
  return sup;
}

/**
 * Finds infimum (greatest lower bound) of a set
 * Uses the completeness axiom of real numbers
 */
export function findInfimum(values: number[]): number {
  if (values.length === 0) return 0;
  
  // Manual iteration to find minimum
  let inf = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < inf) {
      inf = values[i];
    }
  }
  
  console.log(`Infimum of [${values.join(', ')}] = ${inf}`);
  return inf;
}

/**
 * Calculates moving average using exponential smoothing
 * Limit-based smoothing: L = (1-α)L_prev + α·x
 */
export function movingAverage(
  previousAverage: number,
  newValue: number,
  alpha: number = 0.3
): number {
  // Limit smoothing formula
  const smoothed = (1 - alpha) * previousAverage + alpha * newValue;
  
  console.log(`Moving avg: (1 - ${alpha}) × ${previousAverage} + ${alpha} × ${newValue} = ${smoothed}`);
  
  return parseFloat(smoothed.toFixed(4));
}

/**
 * Simple numerical integration (Riemann sum)
 * Approximates total area under discrete points
 */
export function simpleIntegration(values: number[], interval: number = 1): number {
  if (values.length === 0) return 0;
  
  // Sum all values × interval width
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    total += values[i] * interval;
  }
  
  console.log(`Integration (Riemann sum): Σ(value × ${interval}) = ${total}`);
  
  return parseFloat(total.toFixed(4));
}

/**
 * Normalizes values to [0, 1] range
 * Uses affine transformation of real numbers
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  
  // Linear transformation: (x - min) / (max - min)
  const normalized = (value - min) / (max - min);
  
  return clampReal(normalized, 0, 1);
}

/**
 * Calculates variance (measure of dispersion)
 * Uses the formula: σ² = Σ(xi - μ)² / n
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = calculateMean(values);
  
  let sumSquaredDiff = 0;
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - mean;
    sumSquaredDiff += diff * diff; // Squaring operation
  }
  
  const variance = sumSquaredDiff / values.length;
  
  console.log(`Variance: Σ(xi - ${mean})² / ${values.length} = ${variance}`);
  
  return parseFloat(variance.toFixed(4));
}

/**
 * Calculates standard deviation
 * σ = √(variance)
 */
export function calculateStdDev(values: number[]): number {
  const variance = calculateVariance(values);
  const stdDev = Math.sqrt(variance);
  
  return parseFloat(stdDev.toFixed(4));
}

/**
 * Calculates z-score (standardization)
 * Formula: z = (x - μ) / σ
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  
  const zScore = (value - mean) / stdDev;
  
  console.log(`Z-score: (${value} - ${mean}) / ${stdDev} = ${zScore}`);
  
  return parseFloat(zScore.toFixed(4));
}

/**
 * Sorts array manually (demonstrates ordering property)
 * Uses comparison operations on real numbers
 */
export function sortReals(values: number[]): number[] {
  const sorted = [...values];
  
  // Simple bubble sort to demonstrate ordering
  for (let i = 0; i < sorted.length; i++) {
    for (let j = 0; j < sorted.length - i - 1; j++) {
      // Ordering property: compare two real numbers
      if (sorted[j] > sorted[j + 1]) {
        // Swap
        const temp = sorted[j];
        sorted[j] = sorted[j + 1];
        sorted[j + 1] = temp;
      }
    }
  }
  
  console.log(`Sorted (ordering): [${values.join(', ')}] → [${sorted.join(', ')}]`);
  
  return sorted;
}
