# Kids App Lock - API Documentation

## Overview

The Kids App Lock API provides secure endpoints for managing parental controls, app locking, and user management in a mobile application designed to protect children's digital safety.

## Base URL

```
https://api.kids-app-lock.com/v1
```

## Authentication

All API requests require authentication using Bearer tokens. Include the token in the Authorization header:

```http
Authorization: Bearer YOUR_API_TOKEN
```

## Endpoints

### Authentication

#### POST /auth/login

Authenticate a parent user.

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "parent@example.com",
      "name": "John Doe"
    }
  }
}
```

#### POST /auth/register

Register a new parent account.

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

### Child Profiles

#### GET /profiles

Get all child profiles for the authenticated parent.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "profile_123",
      "name": "Emma",
      "age": 8,
      "avatar": "avatar_url",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /profiles

Create a new child profile.

**Request Body:**
```json
{
  "name": "Emma",
  "age": 8,
  "avatar": "optional_avatar_url"
}
```

#### PUT /profiles/{profileId}

Update a child profile.

**Request Body:**
```json
{
  "name": "Emma Updated",
  "age": 9
}
```

#### DELETE /profiles/{profileId}

Delete a child profile.

### App Management

#### GET /profiles/{profileId}/apps

Get all apps and their lock status for a specific child profile.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "app_123",
      "packageName": "com.example.game",
      "name": "Fun Game",
      "icon": "icon_url",
      "isLocked": true,
      "lockSchedule": {
        "enabled": true,
        "timeRanges": [
          {
            "start": "08:00",
            "end": "17:00"
          }
        ]
      }
    }
  ]
}
```

#### POST /profiles/{profileId}/apps/{appId}/lock

Lock an app for a child profile.

**Request Body:**
```json
{
  "lockSchedule": {
    "enabled": false,
    "timeRanges": []
  }
}
```

#### DELETE /profiles/{profileId}/apps/{appId}/lock

Unlock an app for a child profile.

### Time Restrictions

#### GET /profiles/{profileId}/restrictions

Get time restrictions for a child profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyLimit": {
      "enabled": true,
      "minutes": 120
    },
    "bedtime": {
      "enabled": true,
      "start": "21:00",
      "end": "07:00"
    },
    "weekendRules": {
      "enabled": true,
      "extraMinutes": 60
    }
  }
}
```

#### PUT /profiles/{profileId}/restrictions

Update time restrictions for a child profile.

**Request Body:**
```json
{
  "dailyLimit": {
    "enabled": true,
    "minutes": 120
  },
  "bedtime": {
    "enabled": true,
    "start": "21:00",
    "end": "07:00"
  }
}
```

### Usage Analytics

#### GET /analytics/profiles/{profileId}/usage

Get usage analytics for a child profile.

**Query Parameters:**
- `period`: day, week, month (default: week)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsage": 145,
    "apps": [
      {
        "name": "Fun Game",
        "usage": 65,
        "percentage": 44.8
      }
    ],
    "dailyBreakdown": [
      {
        "date": "2024-01-15",
        "usage": 45
      }
    ]
  }
}
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute per user

## Webhooks

The API supports webhooks for real-time notifications. Available events:

- `app.locked`: When an app is locked
- `app.unlocked`: When an app is unlocked
- `usage.exceeded`: When daily usage limit is exceeded
- `bedtime.started`: When bedtime restrictions activate

## SDK Integration

### React Native Example

```javascript
import { KidsAppLockAPI } from '@kids-app-lock/sdk';

const api = new KidsAppLockAPI({
  baseURL: 'https://api.kids-app-lock.com/v1',
  token: 'YOUR_API_TOKEN'
});

// Get child profiles
const profiles = await api.getProfiles();

// Lock an app
await api.lockApp('profile_123', 'com.example.game', {
  lockSchedule: { enabled: true }
});
```

## Support

For API support, contact:
- Email: api-support@kids-app-lock.com
- Documentation: https://docs.kids-app-lock.com
- Status: https://status.kids-app-lock.com

---

**Last Updated**: January 2025  
**API Version**: v1.2.0