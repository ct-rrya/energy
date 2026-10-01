# Utility Functions

This directory contains shared utility functions used across the EcoStep application.

## validateSensorData

Validates sensor readings against expected ranges to ensure data integrity.

### Usage

```typescript
import { validateSensorData } from '@/lib/validateSensorData';

// Validate sensor data
const result = validateSensorData({
  voltage: 240,
  current: 5.5,
  power: 1320,
  stepCount: 5000,
});

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
  // Use last known good value or show error state
} else {
  // Data is valid, safe to use
  displaySensorData(data);
}
```

### Validation Ranges

- **Voltage**: 0-500V
- **Current**: 0-100A
- **Power**: 0-50000W
- **Step Count**: 0-1,000,000

### Return Value

```typescript
interface ValidationResult {
  isValid: boolean;  // true if all values pass validation
  errors: string[];  // array of error messages for failed validations
}
```

### Console Warnings

The function automatically logs console warnings for out-of-range values with the format:
```
[Validation] <field> (<value><unit>) is outside valid range (<min>-<max><unit>)
```

### Requirements

Implements requirements: 16.7, 16.8, 16.9, 16.10, 17.6, 17.7, 19.6
