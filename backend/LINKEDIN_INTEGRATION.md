 t# LinkedIn OAuth Integration - Node.js/Express

This document describes the LinkedIn OAuth integration that has been implemented in your Node.js backend, converted from the Next.js implementation.

## Overview

The LinkedIn integration provides:

- OAuth 2.0 authentication flow
- Secure token storage in MongoDB (Profile model)
- Ability to post text content to LinkedIn
- Connection status checking

## Routes Implemented

### 1. GET `/api/social/linkedin/auth`

Initiates LinkedIn OAuth flow. Requires authentication (user must be logged in).

**Usage:**

- Frontend redirects user to this endpoint
- Server generates random state for CSRF protection
- Stores state in memory with user ID
- Sets cookies for state and session ID
- Redirects user to LinkedIn authorization page

### 2. GET `/api/social/linkedin/callback`

Handles LinkedIn OAuth callback after user authorizes.

**Flow:**

1. Validates state from cookie and memory store
2. Exchanges authorization code for access token (using `application/x-www-form-urlencoded`)
3. Fetches member ID from OpenID userinfo endpoint (primary) or `/v2/me` (fallback)
4. Saves `accessToken` and `memberId` to user's Profile
5. Redirects back to frontend with success/error params

### 3. GET `/api/social/linkedin/status`

Returns connection status for the authenticated user.

**Response:**

```json
{
  "connected": true,
  "memberId": "abc123"
}
```

### 4. POST `/api/social/post` (updated)

Now supports `platform: "linkedin"` parameter.

**Request Body:**

```json
{
  "postId": "post_id_here",
  "platform": "linkedin"
}
```

**Flow:**

1. Retrieves post content from database
2. Gets LinkedIn credentials from user's Profile
3. Posts to LinkedIn using UGC Posts API
4. Returns success response with LinkedIn post ID

### 5. POST `/api/social/connect` (updated)

Now supports manual LinkedIn connection with `platform: "linkedin"`.

**Request Body:**

```json
{
  "platform": "linkedin",
  "accessToken": "token_here",
  "memberId": "member_id_here"
}
```

## Environment Variables Required

Add these to your `.env` file:

```env
# LinkedIn OAuth Credentials
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/social/linkedin/callback

# Optional: Frontend redirect URL after OAuth
OAUTH_SUCCESS_REDIRECT=http://localhost:3000/businesses/dash
```

## LinkedIn App Setup

1. Create a LinkedIn Developer App at https://www.linkedin.com/developers/apps
2. Request approval for these products:
   - **Sign In with LinkedIn (OpenID Connect)** → scopes: `openid`, `profile`
   - **Share on LinkedIn** → scope: `w_member_social`
3. Add Redirect URL in your LinkedIn app settings:
   - Must match `LINKEDIN_REDIRECT_URI` exactly (including port)
   - Example: `http://localhost:5000/api/social/linkedin/callback`

## Database Schema

The Profile model has been updated to include LinkedIn fields:

```javascript
social: {
  linkedin: {
    memberId: String,      // LinkedIn member ID
    accessToken: String,   // LinkedIn access token
    connectedAt: Date      // Connection timestamp
  }
}
```

## Security Features

1. **CSRF Protection**: Random state parameter stored in memory and cookies
2. **State Expiration**: States expire after 10 minutes
3. **Secure Cookies**: HttpOnly, SameSite, and secure flags (in production)
4. **User Authentication**: All routes require authentication via `authMiddleware`

## API Usage Examples

### Frontend: Initiate Connection

```javascript
// Redirect user to LinkedIn auth
window.location.href = "http://localhost:5000/api/social/linkedin/auth";
// (User must be authenticated - send JWT token in Authorization header)
```

### Frontend: Check Connection Status

```javascript
const response = await fetch(
  "http://localhost:5000/api/social/linkedin/status",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const { connected, memberId } = await response.json();
```

### Frontend: Post to LinkedIn

```javascript
const response = await fetch("http://localhost:5000/api/social/post", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    postId: "your_post_id",
    platform: "linkedin",
  }),
});
```

## Error Handling

The callback route redirects with error parameters:

- `?li_error=token_exchange_failed` - Failed to exchange code for token
- `?li_error=member_id_fetch_failed` - Failed to get member ID
- `?li_error=no_member_id` - Member ID not found
- `?li_error=callback_failed` - General callback error

Frontend should check for these and display appropriate error messages.

## Notes

1. **In-Memory State Store**: The state store is in-memory. For production with multiple servers, use Redis or a database.
2. **Token Storage**: Tokens are stored in MongoDB. Consider encrypting sensitive tokens in production.
3. **Token Refresh**: This implementation doesn't handle token refresh. LinkedIn tokens may expire - implement refresh logic if needed.
4. **Member ID Format**: The code stores just the member ID (not the full URN). When posting, it constructs `urn:li:person:${memberId}`.

## Testing

1. Ensure environment variables are set
2. Start the backend server
3. Authenticate a user
4. Navigate to `/api/social/linkedin/auth` (with auth token)
5. Complete LinkedIn authorization
6. Check status via `/api/social/linkedin/status`
7. Post content via `/api/social/post` with `platform: "linkedin"`

## Troubleshooting

- **"LinkedIn OAuth not configured"**: Check `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in `.env`
- **"Invalid or missing state"**: State expired (>10 minutes) or cookie not set properly
- **"unauthorized_scope_error"**: LinkedIn app not approved for required scopes
- **"ACCESS_DENIED me.GET.NO_VERSION"**: Token doesn't have access to `/v2/me` - OpenID userinfo should work instead
- **Redirect URI mismatch**: Ensure `LINKEDIN_REDIRECT_URI` matches exactly what's configured in LinkedIn app settings
