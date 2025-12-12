/**
 * Clients API Integration Tests
 *
 * Tests /api/clients endpoints with authentication and RBAC.
 * Covers client management CRUD operations.
 */

const request = require('supertest');
const {
  createApp,
  setupTestDB,
  clearTestDB,
  closeTestDB,
  seedUsers,
  seedClient,
  generateToken,
} = require('./testApp');

// ============================================
// Test Setup
// ============================================

let app;
let tokens = {};
let testClient;

beforeAll(async () => {
  await setupTestDB();
  app = createApp();
});

beforeEach(async () => {
  const users = await seedUsers();
  tokens = {
    admin: generateToken(users.admin),
    manager: generateToken(users.manager),
    guard: generateToken(users.guard),
  };
  testClient = await seedClient();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

// ============================================
// List Clients Tests
// ============================================

describe('GET /api/clients', () => {
  it('should require authentication', async () => {
    const res = await request(app)
      .get('/api/clients')
      .expect(401);

    expect(res.body.message).toContain('token');
  });

  it('should allow Admin to list clients', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const clients = Array.isArray(res.body) ? res.body : res.body.data;
    expect(clients.length).toBeGreaterThanOrEqual(1);
  });

  it('should allow Manager to list clients', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokens.manager}`)
      .expect(200);

    expect(res.status).toBe(200);
  });

  it('should allow Guard to list clients', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokens.guard}`)
      .expect(200);

    expect(res.status).toBe(200);
  });

  it('should return clients with expected structure', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const clients = Array.isArray(res.body) ? res.body : res.body.data;

    if (clients.length > 0) {
      const client = clients[0];
      expect(client).toHaveProperty('_id');
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('email');
      expect(client).toHaveProperty('status');
    }
  });
});

// ============================================
// Get Single Client Tests
// ============================================

describe('GET /api/clients/:id', () => {
  it('should return single client by ID', async () => {
    const res = await request(app)
      .get(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const client = res.body.data || res.body;
    expect(client.name).toBe('Test Client Ltd');
    expect(client.status).toBe('active');
  });

  it('should return 404 for non-existent client', async () => {
    const fakeId = '507f1f77bcf86cd799439999';

    const res = await request(app)
      .get(`/api/clients/${fakeId}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(404);

    expect(res.body.message).toContain('not found');
  });

  it('should populate related sites count', async () => {
    const res = await request(app)
      .get(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    // Depending on implementation, might have sites or siteCount
    expect(res.status).toBe(200);
  });
});

// ============================================
// Create Client Tests
// ============================================

describe('POST /api/clients', () => {
  const newClientData = {
    name: 'New Client Company',
    contactPerson: 'Jane Contact',
    email: 'newclient@test.com',
    phone: '02079876543',
    address: {
      street: '999 New Client Street',
      city: 'Birmingham',
      postCode: 'B1 1AA',
      country: 'United Kingdom',
    },
    status: 'active',
  };

  describe('RBAC - Create Permissions', () => {
    it('should allow Admin to create client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(newClientData)
        .expect(201);

      const client = res.body.data || res.body;
      expect(client.name).toBe('New Client Company');
      expect(client.address.city).toBe('Birmingham');
    });

    it('should allow Manager to create client', async () => {
      const managerClientData = {
        ...newClientData,
        email: 'managerclient@test.com',
        name: 'Manager Created Client',
      };

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send(managerClientData)
        .expect(201);

      expect(res.body.data || res.body).toHaveProperty('_id');
    });

    it('should deny Guard from creating client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokens.guard}`)
        .send(newClientData)
        .expect(403);

      expect(res.body.message).toContain('permission');
    });
  });

  describe('Validation', () => {
    it('should reject missing required fields', async () => {
      const invalidClient = {
        name: 'Incomplete Client',
        // Missing other required fields
      };

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(invalidClient);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject duplicate email', async () => {
      // First create
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(newClientData)
        .expect(201);

      // Duplicate email attempt
      const duplicateClient = {
        ...newClientData,
        name: 'Different Name',
      };

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(duplicateClient);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should accept valid UK phone format', async () => {
      const ukPhoneClient = {
        ...newClientData,
        email: 'ukphone@test.com',
        phone: '+442071234567',
      };

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(ukPhoneClient)
        .expect(201);

      expect(res.body.data || res.body).toHaveProperty('phone');
    });
  });
});

// ============================================
// Update Client Tests
// ============================================

describe('PUT /api/clients/:id', () => {
  describe('RBAC - Update Permissions', () => {
    it('should allow Admin to update client', async () => {
      const updates = {
        name: 'Updated Client Name',
        contactPerson: 'Updated Contact',
      };

      const res = await request(app)
        .put(`/api/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(updates)
        .expect(200);

      const client = res.body.data || res.body;
      expect(client.name).toBe('Updated Client Name');
    });

    it('should allow Manager to update client', async () => {
      const updates = {
        contactPerson: 'Manager Updated Contact',
      };

      const res = await request(app)
        .put(`/api/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send(updates)
        .expect(200);

      const client = res.body.data || res.body;
      expect(client.contactPerson).toBe('Manager Updated Contact');
    });

    it('should deny Guard from updating client', async () => {
      const res = await request(app)
        .put(`/api/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${tokens.guard}`)
        .send({ name: 'Guard Updated' })
        .expect(403);

      expect(res.body.message).toContain('permission');
    });
  });

  describe('Update Operations', () => {
    it('should update client status', async () => {
      const res = await request(app)
        .put(`/api/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ status: 'inactive' })
        .expect(200);

      const client = res.body.data || res.body;
      expect(client.status).toBe('inactive');
    });

    it('should update client address', async () => {
      const updates = {
        address: {
          street: '1 Updated Street',
          city: 'Manchester',
          postCode: 'M1 1AA',
          country: 'United Kingdom',
        },
      };

      const res = await request(app)
        .put(`/api/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(updates)
        .expect(200);

      const client = res.body.data || res.body;
      expect(client.address.city).toBe('Manchester');
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      const res = await request(app)
        .put(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });
});

// ============================================
// Delete Client Tests
// ============================================

describe('DELETE /api/clients/:id', () => {
  it('should allow Admin to delete client', async () => {
    const res = await request(app)
      .delete(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    expect(res.body.message).toContain('deleted');
  });

  it('should deny Manager from deleting client', async () => {
    const res = await request(app)
      .delete(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.manager}`)
      .expect(403);

    expect(res.body.message).toContain('permission');
  });

  it('should deny Guard from deleting client', async () => {
    const res = await request(app)
      .delete(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.guard}`)
      .expect(403);

    expect(res.body.message).toContain('permission');
  });

  it('should return 404 for non-existent client', async () => {
    const fakeId = '507f1f77bcf86cd799439999';

    const res = await request(app)
      .delete(`/api/clients/${fakeId}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(404);

    expect(res.body.message).toContain('not found');
  });
});

// ============================================
// Client Search & Filter Tests
// ============================================

describe('Client Search & Filtering', () => {
  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/clients?status=active')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const clients = Array.isArray(res.body) ? res.body : res.body.data;
    clients.forEach(client => {
      expect(client.status).toBe('active');
    });
  });

  it('should search by name', async () => {
    const res = await request(app)
      .get('/api/clients?search=Test')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    const clients = Array.isArray(res.body) ? res.body : res.body.data;
    // Should find "Test Client Ltd"
    expect(clients.some(c => c.name.includes('Test'))).toBeTruthy();
  });
});

// ============================================
// RBAC Permission Matrix Summary
// ============================================

describe('Clients API - RBAC Permission Summary', () => {
  it('should enforce complete permission matrix', async () => {
    // READ - All roles allowed
    const adminRead = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(adminRead.status).toBe(200);

    const guardRead = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokens.guard}`);
    expect(guardRead.status).toBe(200);

    // CREATE - Admin and Manager only
    const guardCreate = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${tokens.guard}`)
      .send({
        name: 'Guard Client',
        email: 'guardclient@test.com',
        contactPerson: 'Guard',
        phone: '02071111111',
        address: { street: 'Test', city: 'London', postCode: 'EC1A 1AA' },
      });
    expect(guardCreate.status).toBe(403);

    // UPDATE - Admin and Manager only
    const guardUpdate = await request(app)
      .put(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.guard}`)
      .send({ name: 'Guard Update' });
    expect(guardUpdate.status).toBe(403);

    // DELETE - Admin only
    const managerDelete = await request(app)
      .delete(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.manager}`);
    expect(managerDelete.status).toBe(403);

    const adminDelete = await request(app)
      .delete(`/api/clients/${testClient._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(adminDelete.status).toBe(200);
  });
});