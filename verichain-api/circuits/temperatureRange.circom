pragma circom 2.0.0;

/*
 * Temperature Range Proof Circuit
 * Proves that ALL 30 temperature readings are within the safe range [min, max]
 * without revealing the actual temperature values.
 * 
 * Temperatures are scaled by 10 (e.g., 4.5°C = 45) to work with integers.
 * Safe range: 2.0°C - 8.0°C → scaled: 20 - 80
 */

template RangeCheck(n) {
    signal input values[n];      // Private: 30 temperature readings (scaled by 10)
    signal input min;            // Public: minimum allowed value (20 = 2.0°C)
    signal input max;            // Public: maximum allowed value (80 = 8.0°C)
    signal output valid;         // 1 if all values in range
    
    // All signals must be declared at template level (not inside loops)
    signal diffMin[n];           // values[i] - min (should be >= 0)
    signal diffMax[n];           // max - values[i] (should be >= 0)
    signal bitsMin[n][7];        // Bit decomposition for diffMin (7 bits covers 0-127)
    signal bitsMax[n][7];        // Bit decomposition for diffMax
    signal inRange[n];           // Per-value range check result
    signal accumulator[n+1];     // Running product
    
    accumulator[0] <== 1;
    
    for (var i = 0; i < n; i++) {
        // Calculate differences
        diffMin[i] <== values[i] - min;  // Should be >= 0
        diffMax[i] <== max - values[i];  // Should be >= 0
        
        // Linear constraint: sum of differences equals range
        diffMin[i] + diffMax[i] === max - min;
        
        // Bit decomposition to prove non-negativity
        // If x is non-negative and < 128, it can be represented in 7 bits
        var reconstructMin = 0;
        var reconstructMax = 0;
        
        for (var j = 0; j < 7; j++) {
            // Extract bit j
            bitsMin[i][j] <-- (diffMin[i] >> j) & 1;
            bitsMin[i][j] * (1 - bitsMin[i][j]) === 0;  // Binary constraint
            reconstructMin += bitsMin[i][j] * (1 << j);
            
            bitsMax[i][j] <-- (diffMax[i] >> j) & 1;
            bitsMax[i][j] * (1 - bitsMax[i][j]) === 0;  // Binary constraint
            reconstructMax += bitsMax[i][j] * (1 << j);
        }
        
        // Verify reconstruction matches (proves non-negativity within 7 bits)
        diffMin[i] === reconstructMin;
        diffMax[i] === reconstructMax;
        
        // Mark as in range if no constraint failures
        inRange[i] <== 1;
        accumulator[i+1] <== accumulator[i] * inRange[i];
    }
    
    valid <== accumulator[n];
}

// Main component: 30 temperature readings
component main {public [min, max]} = RangeCheck(30);
