const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const validateToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    logger.info(`Token validation request - Token length: ${token.length}`);
    logger.info(`Token validation request - First 50 chars: ${token.substring(0, 50)}...`);

    // Check if token is a mock token
    if (token.startsWith('mock_token_')) {
      return res.status(400).json({
        success: false,
        error: 'Mock token detected',
        details: {
          isMockToken: true,
          tokenStart: token.substring(0, 20)
        }
      });
    }

    // Check token structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token format',
        details: {
          parts: parts.length,
          expected: 3,
          tokenStart: token.substring(0, 20)
        }
      });
    }

    // Try to decode without verification
    let decodedStructure;
    try {
      decodedStructure = jwt.decode(token, { complete: true });
    } catch (decodeError) {
      return res.status(400).json({
        success: false,
        error: 'Cannot decode token structure',
        details: {
          decodeError: decodeError.message,
          tokenStart: token.substring(0, 20)
        }
      });
    }

    // Try to verify the token
    let verified;
    try {
      verified = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      return res.status(400).json({
        success: false,
        error: 'Token verification failed',
        details: {
          verifyError: verifyError.message,
          structure: decodedStructure,
          tokenStart: token.substring(0, 20)
        }
      });
    }

    // If we get here, the token is valid
    return res.json({
      success: true,
      message: 'Token is valid',
      details: {
        userId: verified.userId,
        issuedAt: new Date(verified.iat * 1000).toISOString(),
        expiresAt: new Date(verified.exp * 1000).toISOString(),
        header: decodedStructure.header,
        payload: verified
      }
    });

  } catch (error) {
    logger.error('Token validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during token validation'
    });
  }
};

module.exports = { validateToken };
