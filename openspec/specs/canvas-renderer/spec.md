# Canvas Renderer Specification

## Purpose
Define the requirements for rendering the generated string art sequence in real-time onto a React Canvas element.

## Requirements

### Requirement: Progressive Rendering
The renderer MUST draw lines progressively as the Web Worker reports them, without blocking the main UI thread.

#### Scenario: Receiving progress from Worker
- GIVEN the Worker emits a `progress` event with 100 new lines
- WHEN the renderer receives the sequence array
- THEN it MUST draw exactly those new lines on the canvas
- AND use `requestAnimationFrame` to ensure smooth drawing

### Requirement: Opacity and Color
The renderer MUST draw lines using a specific RGBA color with high transparency (e.g., `rgba(0, 0, 0, 0.1)`) to simulate the physical stacking of real threads.

#### Scenario: Overlapping lines
- GIVEN multiple lines crossing the same pixel
- WHEN they are rendered
- THEN the intersection point MUST become visually darker, mimicking physical thread density
