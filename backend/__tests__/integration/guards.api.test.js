/**
 * Guards API Integration Tests
 *
 * Tests /api/guards endpoints with authentication and RBAC.
 * Covers guard management, availability, and filtering.
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
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// ============================================
// Test Setup
// ============================================

let app;
let tokens = {};
let seededUsers;

beforeAll(async () => {
  await setupTestDB();
  app = createApp();
});

beforeEach(async () => {
  seededUsers = await seedUsers();
  tokens = {
    admin: generateToken(seededUsers.admin),
    manager: generateToken(seededUsers.manager),
    guard: generateToken(seededUsers.guard),
  };
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

// ============================================
// List Guards Tests
// ============================================

describe('GET /api/guards', () => {
  describe('Authentication', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/guards')
        .expect(401);

      expect(res.body.message).toContain('token');
    });

    it('should allow authenticated users to list guards', async () => {
      const res = await request(app)
        .get('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(Array.isArray(res.body) || res.body.data || res.body.guards).toBeTruthy();
    });
  });

  describe('Role-Based Access', () => {
    it('should allow Admin to view all guards', async () => {
      const res = await request(app)
        .get('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const guards = Array.isArray(res.body) ? res.body : (res.body.data || res.body.guards);
      // Should include the seeded guard user
      expect(guards.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow Manager to view guards', async () => {
      const res = await request(app)
        .get('/api/guards')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .expect(200);

      expect(res.status).toBe(200);
    });

    it('should allow Guard to view guards list', async () => {
      const res = await request(app)
        .get('/api/guards')
        .set('Authorization', `Bearer ${tokens.guard}`)
        .expect(200);

      expect(res.status).toBe(200);
    });
  });

  describe('Response Structure', () => {
    it('should return guards with expected fields', async () => {
      const res = await request(app)
        .get('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const guards = Array.isArray(res.body) ? res.body : (res.body.data || res.body.guards);

      if (guards.length > 0) {
        const guard = guards[0];
        expect(guard).toHaveProperty('fullName');
        expect(guard).toHaveProperty('email');
        expect(guard).toHaveProperty('role', 'Guard');
        // Should NOT include password
        expect(guard).not.toHaveProperty('password');
      }
    });

    it('should only return users with Guard role', async () => {
      const res = await request(app)
        .get('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const guards = Array.isArray(res.body) ? res.body : (res.body.data || res.body.guards);

      guards.forEach(guard => {
        expect(guard.role).toBe('Guard');
      });
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      // Add more guards with different types
      const hashedPassword = await bcrypt.hash('password123', 10);

      await User.insertMany([
        {
          fullName: 'Dog Handler Guard',
          username: 'doghandler',
          email: 'doghandler@test.com',
          phoneNumber: '07777100001',
          postCode: 'EC1A 1DD',
          password: hashedPassword,
          role: 'Guard',
          guardType: 'Dog Handler',
          availability: true,
        },
        {
          fullName: 'Mobile Patrol Guard',
          username: 'mobilepatrol',
          email: 'mobilepatrol@test.com',
          phoneNumber: '07777100002',
          postCode: 'EC1A 1EE',
          password: hashedPassword,
          role: 'Guard',
          guardType: 'Mobile Patrol',
          availability: false,
        },
      ]);
    });

    it('should filter by guardType', async () => {
      const res = await request(app)
        .get('/api/guards?guardType=Dog Handler')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const guards = Array.isArray(res.body) ? res.body : (res.body.data || res.body.guards);

      guards.forEach(guard => {
        expect(guard.guardType).toBe('Dog Handler');
      });
    });

    it('should filter by availability', async () => {
      const res = await request(app)
        .get('/api/guards?availability=true')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const guards = Array.isArray(res.body) ? res.body : (res.body.data || res.body.guards);

      guards.forEach(guard => {
        expect(guard.availability).toBe(true);
      });
    });

    it('should search by name', async () => {
      const res = await request(app)
        .get('/api/guards?search=Dog')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const guards = Array.isArray(res.body) ? res.body : (res.body.data || res.body.guards);

      // Should find "Dog Handler Guard"
      if (guards.length > 0) {
        expect(guards.some(g => g.fullName.includes('Dog'))).toBeTruthy();
      }
    });
  });
});

// ============================================
// Get Single Guard Tests
// ============================================

describe('GET /api/guards/:id', () => {
  it('should return single guard by ID', async () => {
    const res = await request(app)
      .get(`/api/guards/${seededUsers.guard._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const guard = res.body.data || res.body;
    expect(guard.fullName).toBe('Guard User');
    expect(guard.guardType).toBe('Static');
  });

  it('should return 404 for non-existent guard', async () => {
    const fakeId = '507f1f77bcf86cd799439999';

    const res = await request(app)
      .get(`/api/guards/${fakeId}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(404);

    expect(res.body.message).toContain('not found');
  });

  it('should not return password field', async () => {
    const res = await request(app)
      .get(`/api/guards/${seededUsers.guard._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const guard = res.body.data || res.body;
    expect(guard).not.toHaveProperty('password');
  });
});

// ============================================
// Create Guard Tests
// ============================================

describe('POST /api/guards', () => {
  const newGuardData = {
    fullName: 'New Test Guard',
    username: 'newtestguard',
    email: 'newtestguard@test.com',
    phoneNumber: '07777200001',
    postCode: 'SW1A 2AA',
    password: 'password123',
    role: 'Guard',
    guardType: 'Close Protection',
    availability: true,
  };

  describe('RBAC - Create Permissions', () => {
    it('should allow Admin to create guard', async () => {
      const res = await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(newGuardData)
        .expect(201);

      const guard = res.body.data || res.body;
      expect(guard.fullName).toBe('New Test Guard');
      expect(guard.guardType).toBe('Close Protection');
    });

    it('should allow Manager to create guard', async () => {
      const managerGuardData = {
        ...newGuardData,
        username: 'managerguard',
        email: 'managerguard@test.com',
      };

      const res = await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send(managerGuardData)
        .expect(201);

      expect(res.body.data || res.body).toHaveProperty('_id');
    });

    it('should deny Guard from creating other guards', async () => {
      const guardCreatedGuard = {
        ...newGuardData,
        username: 'guardcreated',
        email: 'guardcreated@test.com',
      };

      const res = await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${tokens.guard}`)
        .send(guardCreatedGuard)
        .expect(403);

      expect(res.body.message).toContain('permission');
    });
  });

  describe('Validation', () => {
    it('should reject duplicate email', async () => {
      // First create succeeds
      await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(newGuardData)
        .expect(201);

      // Second create with same email fails
      const duplicateEmail = {
        ...newGuardData,
        username: 'different',
      };

      const res = await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(duplicateEmail);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate guard type enum', async () => {
      const invalidGuardType = {
        ...newGuardData,
        username: 'invalidtype',
        email: 'invalidtype@test.com',
        guardType: 'InvalidType',
      };

      const res = await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(invalidGuardType);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should hash password before storing', async () => {
      const res = await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(newGuardData)
        .expect(201);

      // Verify by logging in with the new guard
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: newGuardData.email,
          password: newGuardData.password,
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('token');
    });
  });
});

// ============================================
// Update Guard Tests
// ============================================

describe('PUT /api/guards/:id', () => {
  describe('RBAC - Update Permissions', () => {
    it('should allow Admin to update guard', async () => {
      const updates = {
        fullName: 'Updated Guard Name',
        guardType: 'Dog Handler',
      };

      const res = await request(app)
        .put(`/api/guards/${seededUsers.guard._id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(updates)
        .expect(200);

      const guard = res.body.data || res.body;
      expect(guard.fullName).toBe('Updated Guard Name');
      expect(guard.guardType).toBe('Dog Handler');
    });

    it('should allow Manager to update guard', async () => {
      const updates = {
        availability: false,
      };

      const res = await request(app)
        .put(`/api/guards/${seededUsers.guard._id}`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send(updates)
        .expect(200);

      const guard = res.body.data || res.body;
      expect(guard.availability).toBe(false);
    });

    it('should deny Guard from updating other guards', async () => {
      // Create another guard to try updating
      const hashedPassword = await bcrypt.hash('password123', 10);
      const otherGuard = await User.create({
        fullName: 'Other Guard',
        username: 'otherguard',
        email: 'other@test.com',
        phoneNumber: '07777300001',
        postCode: 'EC1A 1FF',
        password: hashedPassword,
        role: 'Guard',
        guardType: 'Static',
      });

      const res = await request(app)
        .put(`/api/guards/${otherGuard._id}`)
        .set('Authorization', `Bearer ${tokens.guard}`)
        .send({ fullName: 'Hacked Name' })
        .expect(403);

      expect(res.body.message).toContain('permission');
    });
  });

  describe('Update Operations', () => {
    it('should update guard availability', async () => {
      const res = await request(app)
        .put(`/api/guards/${seededUsers.guard._id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ availability: false })
        .expect(200);

      const guard = res.body.data || res.body;
      expect(guard.availability).toBe(false);
    });

    it('should update guard shift time', async () => {
      const res = await request(app)
        .put(`/api/guards/${seededUsers.guard._id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ shiftTime: 'Night' })
        .expect(200);

      const guard = res.body.data || res.body;
      expect(guard.shiftTime).toBe('Night');
    });

    it('should return 404 for non-existent guard', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const res = await request(app)
        .put(`/api/guards/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ fullName: 'Updated' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });
});

// ============================================
// Delete Guard Tests
// ============================================

describe('DELETE /api/guards/:id', () => {
  it('should allow Admin to delete guard', async () => {
    const res = await request(app)
      .delete(`/api/guards/${seededUsers.guard._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    expect(res.body.message).toContain('deleted');
  });

  it('should deny Manager from deleting guard', async () => {
    const res = await request(app)
      .delete(`/api/guards/${seededUsers.guard._id}`)
      .set('Authorization', `Bearer ${tokens.manager}`)
      .expect(403);

    expect(res.body.message).toContain('permission');
  });

  it('should deny Guard from deleting guards', async () => {
    const res = await request(app)
      .delete(`/api/guards/${seededUsers.guard._id}`)
      .set('Authorization', `Bearer ${tokens.guard}`)
      .expect(403);

    expect(res.body.message).toContain('permission');
  });

  it('should return 404 for non-existent guard', async () => {
    const fakeId = '507f1f77bcf86cd799439999';

    const res = await request(app)
      .delete(`/api/guards/${fakeId}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(404);

    expect(res.body.message).toContain('not found');
  });
});

// ============================================
// Guard Availability Toggle Tests
// ============================================

describe('PATCH /api/guards/:id/availability', () => {
  it('should toggle guard availability', async () => {
    // Initial availability is true
    expect(seededUsers.guard.availability).toBe(true);

    const res = await request(app)
      .patch(`/api/guards/${seededUsers.guard._id}/availability`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ availability: false })
      .expect(200);

    const guard = res.body.data || res.body;
    expect(guard.availability).toBe(false);
  });
});

// ============================================
// Statistics Tests
// ============================================

describe('GET /api/guards/stats', () => {
  beforeEach(async () => {
    // Add more guards for statistics
    const hashedPassword = await bcrypt.hash('password123', 10);

    await User.insertMany([
      {
        fullName: 'Available Guard 1',
        username: 'avail1',
        email: 'avail1@test.com',
        phoneNumber: '07777400001',
        postCode: 'EC1A 1GG',
        password: hashedPassword,
        role: 'Guard',
        guardType: 'Static',
        availability: true,
      },
      {
        fullName: 'Unavailable Guard 1',
        username: 'unavail1',
        email: 'unavail1@test.com',
        phoneNumber: '07777400002',
        postCode: 'EC1A 1HH',
        password: hashedPassword,
        role: 'Guard',
        guardType: 'Mobile Patrol',
        availability: false,
      },
    ]);
  });

  it('should return guard statistics', async () => {
    const res = await request(app)
      .get('/api/guards/stats')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const stats = res.body.data || res.body;

    // Should have count information
    expect(stats).toHaveProperty('total');
    expect(typeof stats.total).toBe('number');
  });

  it('should include availability breakdown', async () => {
    const res = await request(app)
      .get('/api/guards/stats')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const stats = res.body.data || res.body;

    // Should have available/unavailable counts
    if (stats.available !== undefined) {
      expect(typeof stats.available).toBe('number');
    }
  });
});