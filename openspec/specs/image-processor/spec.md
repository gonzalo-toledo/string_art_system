# Image Processor Specification

## Purpose
Define requirements for processing user-uploaded images into the mathematical format required by the String Art core algorithm.

## Requirements

### Requirement: Image Resizing and Cropping
The processor MUST resize the image to exactly the width and height defined by the algorithm parameters (e.g., 500x500) and crop it circularly to match the physical board.

#### Scenario: Processing a rectangular image
- GIVEN a rectangular image uploaded by the user
- WHEN the image is processed
- THEN it MUST be center-cropped to a square
- AND scaled to the target resolution
- AND pixels outside the circle radius MUST be ignored or turned white (value 0)

### Requirement: Grayscale Conversion
The processor MUST convert the image to grayscale and normalize it into a flat Float32Array where values represent the required thread density (darkness).

#### Scenario: Grayscale conversion
- GIVEN the cropped square image
- WHEN extracting pixel data
- THEN RGB values MUST be converted to grayscale (luminance)
- AND inverted so that darker colors = higher values in the `Float32Array` map (error map)
