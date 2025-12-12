/**
 * Role Middleware Unit Tests
 *
 * Tests role-based access control (RBAC) authorization.
 * Demonstrates: middleware factory pattern, permission boundaries.
 */

const roleMiddleware = require('../../middleware/roleMiddleware');

// ============================================
// Test Utilities
// ============================================

const createMockRequest = (user = null) => ({
  user,
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Test users for each role
const adminUser = { _id: 'admin-1', fullName: 'Admin User', role: 'Admin' };
const managerUser = { _id: 'manager-1', fullName: 'Manager User', role: 'Manager' };
const guardUser = { _id: 'guard-1', fullName: 'Guard User', role: 'Guard' };

// ============================================
// Test Suite
// ============================================

describe('Role Middleware (RBAC)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // Authentication Check
  // ------------------------------------------

  describe('Authentication Verification', () => {
    it('should return 401 when req.user is undefined', () => {
      const middleware = roleMiddleware('Admin');
      const req = createMockRequest(undefined);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when req.user is null', () => {
      const middleware = roleMiddleware('Admin');
      const req = createMockRequest(null);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
      });
    });
  });

  // ------------------------------------------
  // Single Role Authorization
  // ------------------------------------------

  describe('Single Role Authorization', () => {
    it('should allow Admin when Admin role is required', () => {
      const middleware = roleMiddleware('Admin');
      const req = createMockRequest(adminUser);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny Manager when only Admin role is allowed', () => {
      const middleware = roleMiddleware('Admin');
      const req = createMockRequest(managerUser);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny Guard when only Manager role is allowed', () => {
      const middleware = roleMiddleware('Manager');
      const req = createMockRequest(guardUser);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow Guard when Guard role is required', () => {
      const middleware = roleMiddleware('Guard');
      const req = createMockRequest(guardUser);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Multiple Roles Authorization
  // ------------------------------------------

  describe('Multiple Roles Authorization', () => {
    it('should allow Admin when Admin OR Manager is required', () => {
      const middleware = roleMiddleware('Admin', 'Manager');
      const req = createMockRequest(adminUser);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow Manager when Admin OR Manager is required', () => {
      const middleware = roleMiddleware('Admin', 'Manager');
      const req = createMockRequest(managerUser);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny Guard when only Admin OR Manager is required', () => {
      const middleware = roleMiddleware('Admin', 'Manager');
      const req = createMockRequest(guardUser);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow any role when all three are specified', () => {
      const middleware = roleMiddleware('Admin', 'Manager', 'Guard');

      // Test Admin
      let req = createMockRequest(adminUser);
      let res = createMockResponse();
      let next = createMockNext();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      // Test Manager
      req = createMockRequest(managerUser);
      res = createMockResponse();
      next = createMockNext();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      // Test Guard
      req = createMockRequest(guardUser);
      res = createMockResponse();
      next = createMockNext();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Role Hierarchy Tests (Business Logic)
  // ------------------------------------------

  describe('Role Hierarchy Business Rules', () => {
    it('Admin should have access to admin-only routes', () => {
      const adminOnlyMiddleware = roleMiddleware('Admin');
      const req = createMockRequest(adminUser);
      const res = createMockResponse();
      const next = createMockNext();

      adminOnlyMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('Manager should NOT have access to admin-only routes', () => {
      const adminOnlyMiddleware = roleMiddleware('Admin');
      const req = createMockRequest(managerUser);
      const res = createMockResponse();
      const next = createMockNext();

      adminOnlyMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('Guard should NOT have access to management routes', () => {
      const managementMiddleware = roleMiddleware('Admin', 'Manager');
      const req = createMockRequest(guardUser);
      const res = createMockResponse();
      const next = createMockNext();

      managementMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ------------------------------------------
  // Edge Cases
  // ------------------------------------------

  describe('Edge Cases', () => {
    it('should handle user with missing role property', () => {
      const middleware = roleMiddleware('Admin');
      const userWithoutRole = { _id: 'user-1', fullName: 'No Role User' };
      const req = createMockRequest(userWithoutRole);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle user with null role', () => {
      const middleware = roleMiddleware('Admin');
      const userWithNullRole = { _id: 'user-1', role: null };
      const req = createMockRequest(userWithNullRole);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle user with invalid role value', () => {
      const middleware = roleMiddleware('Admin', 'Manager', 'Guard');
      const userWithInvalidRole = { _id: 'user-1', role: 'SuperUser' };
      const req = createMockRequest(userWithInvalidRole);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should be case-sensitive for role matching', () => {
      const middleware = roleMiddleware('Admin');
      const userWithLowercaseRole = { _id: 'user-1', role: 'admin' };
      const req = createMockRequest(userWithLowercaseRole);
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      // Should fail because 'admin' !== 'Admin'
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ------------------------------------------
  // Middleware Factory Pattern
  // ------------------------------------------

  describe('Middleware Factory Pattern', () => {
    it('should return a function when called', () => {
      const middleware = roleMiddleware('Admin');
      expect(typeof middleware).toBe('function');
    });

    it('should accept variable number of role arguments', () => {
      const singleRole = roleMiddleware('Admin');
      const twoRoles = roleMiddleware('Admin', 'Manager');
      const threeRoles = roleMiddleware('Admin', 'Manager', 'Guard');

      expect(typeof singleRole).toBe('function');
      expect(typeof twoRoles).toBe('function');
      expect(typeof threeRoles).toBe('function');
    });

    it('should create independent middleware instances', () => {
      const adminOnly = roleMiddleware('Admin');
      const managerOnly = roleMiddleware('Manager');

      // Admin should pass adminOnly but fail managerOnly
      const req1 = createMockRequest(adminUser);
      const res1 = createMockResponse();
      const next1 = createMockNext();
      adminOnly(req1, res1, next1);
      expect(next1).toHaveBeenCalled();

      const req2 = createMockRequest(adminUser);
      const res2 = createMockResponse();
      const next2 = createMockNext();
      managerOnly(req2, res2, next2);
      expect(res2.status).toHaveBeenCalledWith(403);
    });
  });
});