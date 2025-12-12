/**
 * Auth Middleware Unit Tests
 *
 * Tests JWT token verification and user attachment to request.
 * Demonstrates: mocking, async testing, error handling.
 */

const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');
const User = require('../../models/User');

// ============================================
// Mocks
// ============================================

// Mock the User model
jest.mock('../../models/User');

// ============================================
// Test Utilities
// ============================================

const createMockRequest = (authHeader = null) => ({
  header: jest.fn((name) => (name === 'Authorization' ? authHeader : null)),
  user: null,
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Valid test user data
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Test Guard',
  username: 'testguard',
  email: 'test@guardian.com',
  role: 'Guard',
};

// ============================================
// Test Suite
// ============================================

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // Missing Token Tests
  // ------------------------------------------

  describe('Missing Token Scenarios', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const req = createMockRequest(null);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied, no token provided',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is empty', async () => {
      const req = createMockRequest('');
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is malformed (no Bearer prefix)', async () => {
      const req = createMockRequest('invalid-token-format');
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied, token malformed',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer prefix exists but no token', async () => {
      const req = createMockRequest('Bearer ');
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Invalid Token Tests
  // ------------------------------------------

  describe('Invalid Token Scenarios', () => {
    it('should return 400 when token is invalid/corrupted', async () => {
      const req = createMockRequest('Bearer invalid.token.here');
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when token is expired', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const req = createMockRequest(`Bearer ${expiredToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('should return 400 when token has wrong signature', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: mockUser._id },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      const req = createMockRequest(`Bearer ${wrongSecretToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });
  });

  // ------------------------------------------
  // Valid Token Tests
  // ------------------------------------------

  describe('Valid Token Scenarios', () => {
    it('should call next() and attach user when token is valid', async () => {
      const validToken = jwt.sign(
        { userId: mockUser._id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Mock User.findById to return user without password
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = createMockRequest(`Bearer ${validToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found in database', async () => {
      const validToken = jwt.sign(
        { userId: 'nonexistent-user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Mock User.findById to return null
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = createMockRequest(`Bearer ${validToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should exclude password from attached user object', async () => {
      const validToken = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Verify select('-password') is called
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({ select: selectMock });

      const req = createMockRequest(`Bearer ${validToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(selectMock).toHaveBeenCalledWith('-password');
    });
  });

  // ------------------------------------------
  // Edge Cases
  // ------------------------------------------

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      const validToken = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Mock database error
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const req = createMockRequest(`Bearer ${validToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('should handle token with extra whitespace', async () => {
      const validToken = jwt.sign(
        { userId: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Extra space after Bearer
      const req = createMockRequest(`Bearer  ${validToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      // Should handle gracefully (implementation dependent)
      expect(res.status).toHaveBeenCalled();
    });
  });
});