# String Art Core Specification

## Purpose

Define the requirements for the mathematical core that transforms a grayscale image pixel map into a sequence of instructions (pins) for string art rendering.

## Requirements

### Requirement: Initialization & Parameter Validation

The core algorithm MUST accept an initialization payload containing image data and processing parameters. It MUST validate that the parameters are within acceptable ranges.

#### Scenario: Valid parameters provided
- GIVEN a valid grayscale `Float32Array` representing the image error map
- AND valid parameters (maxIterations > 0, totalPins = 240)
- WHEN the algorithm is initialized
- THEN it MUST successfully cache the pin coordinates and precompute Bresenham lines as requested
- AND prepare the internal state for processing

#### Scenario: Missing or invalid parameters
- GIVEN an initialization payload
- WHEN a required parameter (e.g., totalPins) is missing or out of bounds
- THEN the system MUST throw a clear validation error
- AND abort execution

### Requirement: Greedy Line Selection

At each iteration, the algorithm MUST evaluate all valid lines connecting the current pin to other pins, and select the line that maximizes the penalty-adjusted score.

#### Scenario: Selecting the best next pin
- GIVEN the current pin is P_current
- WHEN evaluating lines to valid targets P_target
- THEN the system MUST calculate the score for each line based on the error map and `PENALTY_MULT`
- AND select the pin P_best that yields the highest score
- AND add P_best to the output sequence

#### Scenario: Preventing short lines
- GIVEN the current pin is P_current
- WHEN evaluating target pin P_target
- IF the distance between P_current and P_target is less than `MIN_PIN_DISTANCE`
- THEN the system MUST ignore P_target and not evaluate its score

#### Scenario: Preventing immediate reversal
- GIVEN the current pin is P_current and the previous pin was P_prev
- WHEN evaluating target pin P_target
- IF P_target is equal to P_prev
- THEN the system MUST ignore P_target

### Requirement: State Updating

After selecting the best line, the algorithm MUST update the internal error map to reflect the thread's darkening effect.

#### Scenario: Updating the error map
- GIVEN the algorithm selected a line from P_current to P_next
- WHEN the line is applied
- THEN the system MUST reduce the brightness value of all pixels along the Bresenham path by `LINE_WEIGHT`
- AND update the current pin to P_next

### Requirement: Completion & Early Termination

The algorithm MUST terminate when either the maximum number of iterations is reached or the line score falls below a diminishing returns threshold.

#### Scenario: Reaching maximum iterations
- GIVEN `maxIterations` is set to 3000
- WHEN the loop completes iteration 3000
- THEN the algorithm MUST stop execution
- AND return the final sequence of pins and total string length

#### Scenario: Diminishing returns threshold
- GIVEN the algorithm is running
- WHEN the best score found for the next line is below `MIN_SCORE_THRESHOLD` (e.g., all remaining lines only add noise/overshoot)
- THEN the algorithm MUST terminate early
- AND return the sequence generated up to that point
