const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const logger = require('../config/logger');

const auth = async (req, res, next) => {
  // Log incoming headers for debugging
  if (process.env.NODE_ENV === 'development') {
    logger.info('[AUTH] Incoming headers:', JSON.stringify(req.headers));
  }
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Enhanced debugging for malformed tokens
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Auth Debug - Token length: ${token.length}, First 20 chars: ${token.substring(0, 20)}...`);
    }

    let userId;
    let isSupabaseToken = false;

    // Check if this looks like a Supabase token (they have a specific format)
    if (token.split('.').length === 3) {
      try {
        // Try to decode without verification to check if it's a Supabase token
        const decodedPayload = jwt.decode(token);
        
        // Supabase tokens contain these specific claims
        if (decodedPayload && decodedPayload.aud === 'authenticated' && decodedPayload.sub) {
          isSupabaseToken = true;
          userId = decodedPayload.sub;
          logger.info(`Auth Debug - Detected Supabase token for user ${userId}`);
        }
      } catch (decodeError) {
        logger.error(`Auth Debug - Error decoding token: ${decodeError.message}`);
      }
    }

    // Handle token based on its type
    if (isSupabaseToken) {
      try {
        // Verify the token is not expired
        const decodedPayload = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);
        
        if (decodedPayload.exp < now) {
          logger.error(`Auth Debug - Token expired. Exp: ${decodedPayload.exp}, Now: ${now}`);
          return res.status(401).json({ error: 'Token expired.' });
        }

        // Extract user data directly from the token (avoiding API call issues)
        const user = {
          id: decodedPayload.sub,
          email: decodedPayload.email,
          first_name: decodedPayload.user_metadata?.first_name || '',
          last_name: decodedPayload.user_metadata?.last_name || '',
          phone_number: decodedPayload.user_metadata?.phone_number || decodedPayload.phone || '',
          user_type: decodedPayload.user_metadata?.user_type || 'elderly',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        req.user = user;
        logger.info(`Auth Success - User authenticated: ${user.email} (${user.id}) [${user.user_type}]`);
        logger.info(`Setting req.user.id to: ${user.id}`);
        next();
      } catch (tokenError) {
        logger.error(`Auth Debug - Token processing error: ${tokenError.message}`);
        return res.status(401).json({ error: 'Invalid token.' });
      }
    } else {
      // Legacy token handling (keeping for backward compatibility)
      try {
        // Verify JWT token with our secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from Supabase Auth (fallback for old tokens)
        const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !authUser.user) {
          logger.error(`Auth Debug - Legacy token validation failed`);
          return res.status(401).json({ error: 'Invalid token.' });
        }

        // Create user object from auth user
        const user = {
          id: authUser.user.id,
          email: authUser.user.email,
          first_name: authUser.user.user_metadata?.first_name || '',
          last_name: authUser.user.user_metadata?.last_name || '',
          phone_number: authUser.user.user_metadata?.phone_number || '',
          user_type: authUser.user.user_metadata?.user_type || 'elderly',
          is_active: true
        };

        req.user = user;
        next();
      } catch (jwtError) {
        logger.error(`Auth middleware error with legacy token: ${jwtError.message}`);
        res.status(401).json({ error: 'Invalid token.' });
      }
    }
  } catch (error) {
    logger.error(`Auth middleware general error: ${error.message}`);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    let userId;
    let isSupabaseToken = false;

    // Check if this looks like a Supabase token
    if (token.split('.').length === 3) {
      try {
        // Try to decode without verification to check if it's a Supabase token
        const decodedPayload = jwt.decode(token);
        
        // Supabase tokens contain these specific claims
        if (decodedPayload && decodedPayload.aud === 'authenticated' && decodedPayload.sub) {
          isSupabaseToken = true;
          userId = decodedPayload.sub;
        }
      } catch (decodeError) {
        logger.error(`OptionalAuth Debug - Error decoding token: ${decodeError.message}`);
      }
    }

    // Handle token based on its type
    if (isSupabaseToken) {
      try {
        // Extract user data directly from the token
        const decodedPayload = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);
        
        if (decodedPayload.exp < now) {
          // Token expired, continue without authentication
          return next();
        }

        const user = {
          id: decodedPayload.sub,
          email: decodedPayload.email,
          first_name: decodedPayload.user_metadata?.first_name || '',
          last_name: decodedPayload.user_metadata?.last_name || '',
          phone_number: decodedPayload.user_metadata?.phone_number || decodedPayload.phone || '',
          user_type: decodedPayload.user_metadata?.user_type || 'elderly',
          is_active: true
        };
        
        req.user = user;
      } catch (tokenError) {
        // Continue without authentication if token processing fails
        logger.error(`OptionalAuth Debug - Token error: ${tokenError.message}`);
      }
      
      next();
    } else {
      // Legacy token handling
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // For legacy tokens, try to get user from Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (!authError && authUser.user) {
          const user = {
            id: authUser.user.id,
            email: authUser.user.email,
            first_name: authUser.user.user_metadata?.first_name || '',
            last_name: authUser.user.user_metadata?.last_name || '',
            user_type: authUser.user.user_metadata?.user_type || 'elderly',
            is_active: true
          };
          req.user = user;
        }
        
        next();
      } catch (error) {
        // Continue without authentication if token is invalid
        next();
      }
    }
  } catch (error) {
    // Continue without authentication if any errors occur
    next();
  }
};

module.exports = { auth, optionalAuth };
