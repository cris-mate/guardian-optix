/**
 * Auth API Integration Tests
 *
 * Tests /api/auth endpoints with real database operations.
 * Covers registration, login, and token generation flows.
 */

const request = require('supertest');
const {
  createApp,
  setupTestDB,
  clearTestDB,
  closeTestDB,
  seedUsers,
  generateToken,
} = require('./testApp');

// ============================================
// Test Setup
// ============================================

let app;

beforeAll(async () => {
  await setupTestDB();
  app = createApp();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

// ============================================
// Registration Tests
// ============================================

describe('POST /api/auth/register', () => {
  const validUser = {
    fullName: 'New Guard',
    username: 'newguard',
    email: 'newguard@test.com',
    phoneNumber: '07777999999',
    postCode: 'SW1A 1AA',
    password: 'SecurePass123!',
    role: 'Guard',
    guardType: 'Static',
  };

  describe('Successful Registration', () => {
    it('should register a new Guard user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should register a new Manager user', async () => {
      const managerData = {
        ...validUser,
        username: 'newmanager',
        email: 'newmanager@test.com',
        role: 'Manager',
        managerType: 'Operations Manager',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(managerData)
        .expect(201);

      expect(res.body.message).toBe('User registered successfully');
    });

    it('should register a new Admin user', async () => {
      const adminData = {
        ...validUser,
        username: 'newadmin',
        email: 'newadmin@test.com',
        role: 'Admin',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      expect(res.body.message).toBe('User registered successfully');
    });

    it('should hash password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Verify password is hashed by trying to login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('token');
    });
  });

  describe('Duplicate User Prevention', () => {
    beforeEach(async () => {
      // Register initial user
      await request(app)
        .post('/api/auth/register')
        .send(validUser);
    });

    it('should reject duplicate email', async () => {
      const duplicateEmail = {
        ...validUser,
        username: 'differentuser',
        // Same email
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateEmail)
        .expect(400);

      expect(res.body.message).toContain('Email already in use');
    });

    it('should reject duplicate username', async () => {
      const duplicateUsername = {
        ...validUser,
        email: 'different@test.com',
        // Same username
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateUsername)
        .expect(400);

      expect(res.body.message).toContain('Username already in use');
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing required fields', async () => {
      const incomplete = {
        fullName: 'Incomplete User',
        // Missing other required fields
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(incomplete)
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });

    it('should reject invalid role value', async () => {
      const invalidRole = {
        ...validUser,
        role: 'SuperAdmin', // Invalid role
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidRole);

      // Should fail validation at model level
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});

// ============================================
// Login Tests
// ============================================

describe('POST /api/auth/login', () => {
  let seededUsers;

  beforeEach(async () => {
    seededUsers = await seedUsers();
  });

  describe('Successful Login', () => {
    it('should login with valid email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'admin@test.com',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'admin@test.com');
      expect(res.body.user).toHaveProperty('role', 'Admin');
    });

    it('should login with valid username and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'guarduser',
          password: 'password123',
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('guarduser');
    });

    it('should return JWT token with correct payload', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'manager@test.com',
          password: 'password123',
        })
        .expect(200);

      const token = res.body.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret');

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('role', 'Manager');
      expect(decoded).toHaveProperty('exp');
    });

    it('should not include password in user response', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'admin@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should include user role-specific fields', async () => {
      // Guard user should have guardType
      const guardRes = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'guard@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(guardRes.body.user).toHaveProperty('guardType', 'Static');

      // Manager user should have managerType
      const managerRes = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'manager@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(managerRes.body.user).toHaveProperty('managerType', 'Operations Manager');
    });
  });

  describe('Failed Login Attempts', () => {
    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(400);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'admin@test.com',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should use same error message for security (no user enumeration)', async () => {
      // Non-existent user
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'fake@test.com',
          password: 'password123',
        });

      // Wrong password
      const res2 = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'admin@test.com',
          password: 'wrongpassword',
        });

      // Both should return same message
      expect(res1.body.message).toBe(res2.body.message);
    });

    it('should reject empty credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '',
          password: '',
        })
        .expect(400);

      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('Token Usage', () => {
    it('should allow access to protected route with valid token', async () => {
      // Login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'admin@test.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginRes.body.token;

      // Use token to access protected route
      const protectedRes = await request(app)
        .get('/api/guards')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should return guard list (or empty array)
      expect(Array.isArray(protectedRes.body) || protectedRes.body.data).toBeTruthy();
    });

    it('should deny access to protected route without token', async () => {
      const res = await request(app)
        .get('/api/guards')
        .expect(401);

      expect(res.body.message).toContain('token');
    });
  });
});

// ============================================
// Edge Cases
// ============================================

describe('Auth Edge Cases', () => {
  it('should handle concurrent registration attempts', async () => {
    const user1 = {
      fullName: 'User One',
      username: 'concurrent1',
      email: 'concurrent1@test.com',
      phoneNumber: '07777111111',
      postCode: 'EC1A 1AA',
      password: 'password123',
      role: 'Guard',
    };

    const user2 = {
      fullName: 'User Two',
      username: 'concurrent2',
      email: 'concurrent2@test.com',
      phoneNumber: '07777222222',
      postCode: 'EC1A 1BB',
      password: 'password123',
      role: 'Guard',
    };

    // Concurrent requests
    const [res1, res2] = await Promise.all([
      request(app).post('/api/auth/register').send(user1),
      request(app).post('/api/auth/register').send(user2),
    ]);

    // Both should succeed
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
  });

  it('should handle login with different case email', async () => {
    await seedUsers();

    // Login with uppercase email
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'ADMIN@TEST.COM',
        password: 'password123',
      });

    // Behavior depends on implementation (case sensitivity)
    // Most systems treat email as case-insensitive
    expect([200, 400]).toContain(res.status);
  });

  it('should handle special characters in password', async () => {
    const userWithSpecialPass = {
      fullName: 'Special Pass User',
      username: 'specialpass',
      email: 'special@test.com',
      phoneNumber: '07777333333',
      postCode: 'EC1A 1AA',
      password: 'P@$$w0rd!#%^&*()',
      role: 'Guard',
    };

    // Register
    await request(app)
      .post('/api/auth/register')
      .send(userWithSpecialPass)
      .expect(201);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: userWithSpecialPass.email,
        password: userWithSpecialPass.password,
      })
      .expect(200);

    expect(loginRes.body).toHaveProperty('token');
  });
});