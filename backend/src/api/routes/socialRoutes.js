// socialRoutes.js (updated: redirect target -> /connectplatform by default)
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const authMiddleware = require('../middlewares/authMiddleware');
const Profile = require('../../models/profileModel');
const jwt = require('jsonwebtoken');
const { publishPostById, SocialPublishError } = require('../../services/socialPublisher');

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
// Must match the URL you configure in Meta and the URL you pass to the login dialog
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:5000/api/social/facebook/callback';

// LinkedIn OAuth constants
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/social/linkedin/callback';
const LINKEDIN_SCOPES = process.env.LINKEDIN_SCOPES || 'openid profile w_member_social';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const LINKEDIN_ME_URL = 'https://api.linkedin.com/v2/me';

// Twitter OAuth constants
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'http://localhost:5000/api/social/twitter/callback';
const TWITTER_SCOPES = 'tweet.read tweet.write users.read offline.access';
const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWITTER_ME_URL = 'https://api.twitter.com/2/users/me';

// FRONTEND redirect default: use OAUTH_SUCCESS_REDIRECT env if set, otherwise /connectplatform
const FRONTEND_SUCCESS_REDIRECT = process.env.OAUTH_SUCCESS_REDIRECT || 'http://localhost:3000/connectplatform';

// In-memory store for LinkedIn OAuth state (for CSRF protection)
// In production, use Redis or a database
const linkedinStateStore = new Map();
const twitterStateStore = new Map();

const toBase64Url = (buffer) => buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const buildPkcePair = () => {
  const codeVerifier = toBase64Url(crypto.randomBytes(32));
  const codeChallenge = toBase64Url(crypto.createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
};

// Extract userId from either Authorization header (Bearer) or ?token= JWT
const resolveUserIdFromRequest = (req) => {
  const bearer = req.headers?.authorization?.split(' ')[1];
  const token = bearer || req.query?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.user?.id || null;
  } catch (_) {
    return null;
  }
};

// Save social connection details (simple server-side store). Frontend provides ids and tokens.
router.post('/social/connect', authMiddleware, async (req, res) => {
  try {
    const { platform, pageId, igBusinessId, accessToken } = req.body || {};
    if (!platform || !accessToken) {
      return res.status(400).json({ error: 'platform and accessToken are required.' });
    }
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (platform === 'facebook') {
      profile.social = profile.social || {};
      profile.social.facebook = {
        pageId: pageId || profile.social?.facebook?.pageId,
        accessToken,
        connectedAt: new Date(),
        status: 'active',
      };
    } else if (platform === 'instagram') {
      profile.social = profile.social || {};
      profile.social.instagram = {
        igBusinessId: igBusinessId || profile.social?.instagram?.igBusinessId,
        accessToken,
        connectedAt: new Date(),
        status: 'active',
      };
    } else if (platform === 'linkedin') {
      profile.social = profile.social || {};
      const memberId = req.body.memberId || profile.social?.linkedin?.memberId;
      if (!memberId) {
        return res.status(400).json({ error: 'memberId is required for LinkedIn' });
      }
      profile.social.linkedin = {
        memberId,
        accessToken,
        connectedAt: new Date(),
        status: 'active',
      };
    } else if (platform === 'twitter') {
      const { twitterUserId, username, refreshToken, expiresAt, oauthToken, oauthTokenSecret } = req.body || {};
      if (!twitterUserId) {
        return res.status(400).json({ error: 'twitterUserId is required for Twitter' });
      }
      profile.social = profile.social || {};
      profile.social.twitter = {
        userId: twitterUserId,
        username,
        accessToken,
        oauthToken: oauthToken || profile.social?.twitter?.oauthToken || null,
        oauthTokenSecret: oauthTokenSecret || profile.social?.twitter?.oauthTokenSecret || null,
        refreshToken: refreshToken || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        connectedAt: new Date(),
        status: 'active',
      };
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
    await profile.save();
    return res.status(200).json({ message: 'Connected successfully', social: profile.social });
  } catch (e) {
    console.error('connect error', e);
    return res.status(500).json({ error: 'Failed to connect' });
  }
});

// Disconnect a social platform: clears stored credentials for the user
router.post('/social/disconnect', authMiddleware, async (req, res) => {
  try {
    const { platform } = req.body || {};
    if (!platform) return res.status(400).json({ error: 'platform is required' });
    const unsetPath =
      platform === 'facebook' ? 'social.facebook' :
        platform === 'instagram' ? 'social.instagram' :
          platform === 'linkedin' ? 'social.linkedin' :
            platform === 'twitter' ? 'social.twitter' : null;
    if (!unsetPath) return res.status(400).json({ error: 'Unsupported platform' });

    // Unset the specific platform key atomically
    await Profile.updateOne({ user: req.user.id }, { $unset: { [unsetPath]: '' } });

    // Fetch latest and conditionally remove empty social object
    const latest = await Profile.findOne({ user: req.user.id }).lean();
    const social = latest?.social || {};
    const hasAny = !!(social.facebook || social.instagram || social.linkedin || social.twitter);
    if (!hasAny) {
      await Profile.updateOne({ user: req.user.id }, { $unset: { social: '' } });
      return res.status(200).json({ success: true, social: undefined });
    }
    return res.status(200).json({ success: true, social });
  } catch (e) {
    console.error('disconnect error', e);
    return res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Post to selected social platform using stored credentials and a generated post record
router.post('/social/post', authMiddleware, async (req, res) => {
  try {
    const { postId, platform } = req.body || {};
    const result = await publishPostById({
      userId: req.user.id,
      postId,
      platform,
    });
    return res.status(200).json(result);
  } catch (e) {
    if (e instanceof SocialPublishError) {
      return res.status(e.statusCode || 500).json({ error: e.message, details: e.details });
    }
    const fbErr = e?.response?.data || e.message;
    console.error('social post error', fbErr);
    const message = e?.response?.data?.error?.message || e.message || 'Failed to post';
    return res.status(500).json({ error: message, details: fbErr });
  }
});

module.exports = router;

// OAuth callback (server-side) - exchanges code for token, saves Page/IG details
// Frontend should initiate login dialog with &state=<JWT> so we can map to the current user
router.get('/social/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query || {};
    if (!code) return res.status(400).send('Missing code');
    if (!state) return res.status(400).send('Missing state');
    if (!META_APP_ID || !META_APP_SECRET) return res.status(500).send('Server missing META_APP_ID/SECRET');

    // Verify state (JWT from your app) to identify the user
    let userId;
    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      userId = decoded?.user?.id;
    } catch (e) {
      return res.status(401).send('Invalid state');
    }
    if (!userId) return res.status(401).send('Invalid user');

    // Exchange code -> user access token
    const tokenResp = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code,
      }
    });
    const userAccessToken = tokenResp.data?.access_token;
    if (!userAccessToken) {
        return res.status(500).send('Failed to get user token');
    }

    // Get pages the user manages (and page access tokens)
    const pagesUrl = 'https://graph.facebook.com/v19.0/me/accounts';
    
    const pagesResp = await axios.get(pagesUrl, {
      params: { access_token: userAccessToken, fields: 'id,name,access_token,tasks' }
    });
    const pages = pagesResp.data?.data || [];

    if (!pages.length) {
      const redirectWithError = `${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}connect_error=true&no_pages=true`;
      return res.redirect(redirectWithError);
    }

    // Filter for pages that actually have an access_token
    const validPages = pages.filter(p => p.access_token);
    
    if (!validPages.length) {
      console.error('No pages with access_token found');
      const redirectWithError = `${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}connect_error=true&no_page_token=true`;
      return res.redirect(redirectWithError);
    }

    // Prefer a page the user can manage/create content for
    const manageable = validPages.find(p => Array.isArray(p.tasks) && (p.tasks.includes('CREATE_CONTENT') || p.tasks.includes('MANAGE')));
    const page = manageable || validPages[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token;

    if (!pageAccessToken) {
        // Should be covered by validPages check, but double check
        return res.status(500).send('Failed to obtain page access token');
    }

    // Try to fetch IG Business account id from the Page
    let igBusinessId = null;
    let igError = null;
    try {
      const igResp = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
        params: { fields: 'instagram_business_account', access_token: pageAccessToken }
      });

      if (igResp.data?.error) {
        igError = igResp.data.error.message || 'Instagram account fetch error';
        console.error('Error fetching Instagram ID:', igResp.data.error);
      } else if (!igResp.data?.instagram_business_account) {
        igError = 'This Facebook Page is not connected to an Instagram account.';
        console.error(`No Instagram account linked to Page ${pageId}. Full response:`, igResp.data);
      } else {
        igBusinessId = igResp.data.instagram_business_account.id;
        console.log('Successfully found Instagram Account ID:', igBusinessId);
      }
    } catch (e) {
      igError = e?.response?.data?.error?.message || 'Failed to fetch Instagram account';
      console.error('Exception fetching Instagram ID:', e?.response?.data || e.message);
      console.error('Full error:', e);
    }

    // Save to profile
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = new Profile({ user: userId, onboardingComplete: false, social: {} });
    }
    profile.social = profile.social || {};
    profile.social.facebook = { pageId, accessToken: pageAccessToken, connectedAt: new Date(), status: 'active' };
    if (igBusinessId) {
      profile.social.instagram = { igBusinessId, accessToken: pageAccessToken, connectedAt: new Date(), status: 'active' };
    }
    await profile.save();

    // Redirect back to frontend with appropriate success message
    let redirectUrl = FRONTEND_SUCCESS_REDIRECT;

    // If both platforms connected, show success for both
    if (igBusinessId) {
      redirectUrl = `${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}connected=facebook,instagram`;
    } else {
      // Only Facebook connected, but check if Instagram error occurred
      if (igError) {
        // Instagram connection failed, but Facebook succeeded
        redirectUrl = `${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}connected=facebook&instagram_error=true`;
      } else {
        redirectUrl = `${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}connected=facebook`;
      }
    }

    return res.redirect(redirectUrl);
  } catch (e) {
    console.error('facebook callback error', e?.response?.data || e.message);
    return res.status(500).send('OAuth flow failed');
  }
});

// ========== LinkedIn OAuth Routes ==========

// GET /api/social/linkedin/auth - Initiate LinkedIn OAuth flow
router.get('/social/linkedin/auth', async (req, res) => {
  try {
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      return res.status(500).json({ error: 'LinkedIn OAuth not configured. Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET' });
    }

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Resolve userId from auth middleware (if present) or from JWT passed as ?token
    let userId = req.user?.id;
    if (!userId && req.query?.token) {
      try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        userId = decoded?.user?.id;
      } catch (_) { /* ignore */ }
    }
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing token' });
    }

    // Store state in memory with user ID and timestamp
    linkedinStateStore.set(state, {
      userId,
      timestamp: Date.now(),
    });

    // Clean up old states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of linkedinStateStore.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        linkedinStateStore.delete(key);
      }
    }

    // Set state and session ID in cookies
    res.cookie('li_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    // Generate session ID for minimal session correlation
    const sid = Math.random().toString(36).substring(2, 15);
    res.cookie('sid', sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    // Build LinkedIn OAuth URL
    const authUrl = new URL(LINKEDIN_AUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', LINKEDIN_REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', LINKEDIN_SCOPES);
    authUrl.searchParams.set('prompt', 'consent'); // Force re-consent during testing

    return res.redirect(authUrl.toString());
  } catch (e) {
    console.error('LinkedIn auth error:', e);
    return res.status(500).json({ error: 'Failed to initiate LinkedIn OAuth' });
  }
});

// GET /api/social/linkedin/callback - Handle LinkedIn OAuth callback
router.get('/social/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query || {};

    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}li_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    if (!state) {
      return res.status(400).send('Missing state parameter');
    }

    // Verify state from cookie and memory store; fallback to JWT decode if missing
    const cookieState = req.cookies?.li_state;
    if (!cookieState || cookieState !== state) {
      // Attempt JWT fallback in case in-memory state was lost/restarted
      try {
        const decodedFallback = jwt.verify(state, process.env.JWT_SECRET);
        if (decodedFallback?.user?.id) {
          req.user = { id: decodedFallback.user.id };
        } else {
          return res.status(401).send('Invalid or missing state');
        }
      } catch (e) {
        return res.status(401).send('Invalid or missing state');
      }
    }

    const stateData = linkedinStateStore.get(state);
    let userId = stateData?.userId;
    if (!userId && req.user?.id) {
      userId = req.user.id;
    }
    if (!userId) {
      return res.status(401).send('State expired or invalid');
    }

    // Clean up state
    linkedinStateStore.delete(state);
    res.clearCookie('li_state');

    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      return res.status(500).send('LinkedIn OAuth not configured');
    }

    // Exchange code for access token (LinkedIn requires application/x-www-form-urlencoded)
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', LINKEDIN_REDIRECT_URI);
    tokenParams.append('client_id', LINKEDIN_CLIENT_ID);
    tokenParams.append('client_secret', LINKEDIN_CLIENT_SECRET);

    let accessToken;
    try {
      const tokenResp = await axios.post(LINKEDIN_TOKEN_URL, tokenParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      accessToken = tokenResp.data?.access_token;
      if (!accessToken) {
        console.error('LinkedIn token response:', tokenResp.data);
        throw new Error('Failed to get access token from LinkedIn');
      }
    } catch (e) {
      console.error('LinkedIn token exchange error:', e?.response?.data || e.message);
      return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}li_error=token_exchange_failed`);
    }

    // Resolve LinkedIn member ID
    // Try OpenID userinfo first (primary method)
    let memberId = null;
    try {
      const userinfoResp = await axios.get(LINKEDIN_USERINFO_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      memberId = userinfoResp.data?.sub; // sub is the member ID in OpenID Connect
      if (memberId) {
        console.log('Got member ID from OpenID userinfo:', memberId);
      }
    } catch (e) {
      console.warn('OpenID userinfo failed, trying /v2/me fallback:', e?.response?.data || e.message);
    }

    // Fallback to /v2/me if OpenID userinfo didn't work
    if (!memberId) {
      try {
        const meResp = await axios.get(LINKEDIN_ME_URL, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        // Extract member ID from the response (format may vary)
        memberId = meResp.data?.id || meResp.data?.sub;
        if (memberId) {
          console.log('Got member ID from /v2/me:', memberId);
        }
      } catch (e) {
        console.error('Failed to get member ID from both endpoints:', e?.response?.data || e.message);
        return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}li_error=member_id_fetch_failed`);
      }
    }

    if (!memberId) {
      return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}li_error=no_member_id`);
    }

    // Save to profile
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = new Profile({ user: userId, onboardingComplete: false, social: {} });
    }
    profile.social = profile.social || {};
    profile.social.linkedin = {
      memberId,
      accessToken,
      connectedAt: new Date(),
      status: 'active',
    };
    await profile.save();

    console.log('LinkedIn connection saved for user:', userId);

    // Redirect back to frontend
    return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}connected=linkedin`);
  } catch (e) {
    console.error('LinkedIn callback error:', e?.response?.data || e.message);
    return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}${FRONTEND_SUCCESS_REDIRECT.includes('?') ? '&' : '?'}li_error=callback_failed`);
  }
});

// GET /api/social/linkedin/status - Check LinkedIn connection status
router.get('/social/linkedin/status', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const linkedin = profile?.social?.linkedin;

    const connected = !!(linkedin?.accessToken && linkedin?.memberId);

    return res.status(200).json({
      connected,
      memberId: linkedin?.memberId || null,
    });
  } catch (e) {
    console.error('LinkedIn status error:', e);
    return res.status(500).json({ error: 'Failed to check LinkedIn status' });
  }
});

// ========== Twitter OAuth Routes ==========

// ✅ REPLACE THE '/social/twitter/auth' ROUTE WITH THIS:
router.get('/social/twitter/auth', async (req, res) => {
  try {
    if (!TWITTER_CLIENT_ID) {
      return res.status(500).json({ error: 'Twitter OAuth not configured. Missing TWITTER_CLIENT_ID' });
    }

    // 1. Resolve User
    // (Ensure resolveUserIdFromRequest is defined in your file, otherwise use your old logic for this part)
    let userId = req.user?.id;
    if (!userId && resolveUserIdFromRequest) {
         userId = resolveUserIdFromRequest(req);
    }
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    }

    // 2. Generate PKCE
    const state = crypto.randomBytes(16).toString('hex');
    const { codeVerifier, codeChallenge } = buildPkcePair(); // Ensure buildPkcePair is defined in your file
    
    // 3. Store State
    twitterStateStore.set(state, { userId, codeVerifier, createdAt: Date.now() });

    // 4. Build URL with CORRECT SCOPES
    const authUrl = new URL(TWITTER_AUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', TWITTER_REDIRECT_URI);
    
    // This is the specific fix:
    authUrl.searchParams.set('scope', TWITTER_SCOPES);
    
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return res.redirect(authUrl.toString());
  } catch (e) {
    console.error('Twitter auth error:', e);
    return res.status(500).json({ error: 'Failed to initiate Twitter OAuth' });
  }
});

// ✅ REPLACE THE '/social/twitter/callback' ROUTE WITH THIS:
router.get('/social/twitter/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query || {};

    if (error) {
      // Make sure FRONTEND_SUCCESS_REDIRECT is defined in your file
      return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}?tw_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    const stateData = twitterStateStore.get(state);
    if (!stateData) {
      return res.status(401).send('State expired or invalid');
    }

    const { userId, codeVerifier } = stateData;
    twitterStateStore.delete(state);

    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', TWITTER_REDIRECT_URI);
    tokenParams.append('client_id', TWITTER_CLIENT_ID);
    tokenParams.append('code_verifier', codeVerifier);

    const tokenHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (TWITTER_CLIENT_SECRET) {
      tokenHeaders.Authorization = `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`;
    }

    let accessToken, refreshToken, expiresAt;

    try {
      const tokenResp = await axios.post(TWITTER_TOKEN_URL, tokenParams, { headers: tokenHeaders });
      accessToken = tokenResp.data?.access_token;
      refreshToken = tokenResp.data?.refresh_token || null;
      if (tokenResp.data?.expires_in) {
        expiresAt = new Date(Date.now() + tokenResp.data.expires_in * 1000);
      }
    } catch (e) {
      console.error('Twitter token error:', e?.response?.data || e.message);
      return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}?tw_error=token_exchange_failed`);
    }

    // Get User Details
    let twitterUserId, username;
    try {
      const meResp = await axios.get(TWITTER_ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      twitterUserId = meResp.data?.data?.id;
      username = meResp.data?.data?.username;
    } catch (e) {
      return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}?tw_error=user_fetch_failed`);
    }

    // Update Database
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = new Profile({ user: userId, onboardingComplete: false, social: {} });
    }
    profile.social = profile.social || {};
    profile.social.twitter = {
      userId: twitterUserId,
      username,
      accessToken,
      refreshToken, 
      expiresAt,
      connectedAt: new Date(),
      status: 'active',
    };
    
    // Clear old tokens to avoid confusion
    if (profile.social.twitter.oauthToken) profile.social.twitter.oauthToken = undefined;
    if (profile.social.twitter.oauthTokenSecret) profile.social.twitter.oauthTokenSecret = undefined;

    await profile.save();

    return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}?connected=twitter`);
  } catch (e) {
    console.error('Twitter callback error:', e?.response?.data || e.message);
    return res.redirect(`${FRONTEND_SUCCESS_REDIRECT}?tw_error=callback_failed`);
  }
});

router.get('/social/twitter/status', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const twitter = profile?.social?.twitter;
    const connected = !!(twitter?.accessToken && twitter?.userId);

    return res.status(200).json({
      connected,
      userId: twitter?.userId || null,
      username: twitter?.username || null,
      expiresAt: twitter?.expiresAt || null,
    });
  } catch (e) {
    console.error('Twitter status error:', e);
    return res.status(500).json({ error: 'Failed to check Twitter status' });
  }
});
  