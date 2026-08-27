# Environment Variable Validation Test

## What We're Testing

Our application should **fail to start** if required environment variables are missing or invalid.

## Validation Rules

| Variable | Rule | Example |
|----------|------|---------|
| `NODE_ENV` | Must be: development, production, or test | ✅ `development` |
| `PORT` | Must be a number | ✅ `3000` |
| `MONGODB_URI` | Required | ✅ `mongodb+srv://...` |
| `JWT_SECRET` | Required, minimum 16 characters | ✅ `your-super-secret-jwt-key...` |
| `IOT_API_KEY` | Required | ✅ `your-iot-device-api-key...` |

## What Happens on Validation Failure?

If any required variable is missing or invalid, you'll see:

```
Error: Config validation error: "MONGODB_URI" is required
```

The application will NOT start. This is intentional and prevents runtime errors.

## Current Status

Run this command to see your current configuration:

```bash
curl http://localhost:3000/api/config
```

All values are masked for security (only first 4 and last 4 characters shown).

## ✅ Verification Complete

If you can see the `/api/config` endpoint response, validation is working correctly!
