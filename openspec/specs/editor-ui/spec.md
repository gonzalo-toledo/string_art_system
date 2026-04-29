# Editor UI Specification

## Purpose
Define the layout and interactions of the main editor page where users generate their string art.

## Requirements

### Requirement: Upload Interface
The editor MUST provide an intuitive interface to select an image file from the device.

#### Scenario: Selecting a valid image
- GIVEN the editor page is loaded
- WHEN the user clicks the upload zone
- THEN the native file picker MUST open accepting PNG and JPG files
- AND upon selection, the image MUST appear in a preview

### Requirement: Configuration Controls
The editor MUST expose controls (sliders/inputs) for key parameters like "Total Pins" and "Max Iterations", with sensible defaults based on physical kits.

#### Scenario: Adjusting parameters
- GIVEN the editor is loaded
- WHEN the user adjusts the "Max Iterations" slider
- THEN the state MUST update and be ready to pass to the Worker

### Requirement: Generation Trigger
The editor MUST have a clear "Generate" button that orchestrates the `image-processor` and spawns the Web Worker.

#### Scenario: Starting generation
- GIVEN an image is uploaded and previewed
- WHEN the user clicks "Generate"
- THEN the processing MUST start
- AND the UI MUST display a progress indicator (e.g., "500 / 3000 lines")
