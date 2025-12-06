/**
 * Client Controller
 */

const Client = require('../models/Client');
const Site = require('../models/Site');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// GET /api/clients
const getClients = asyncHandler(async (req, res) => {
  const { search, status, sortBy, sortOrder, page, limit } = req.query;
  const result = await Client.searchClients(search, { status, sortBy, sortOrder, page, limit });

  // Fetch sites for all clients in one query
  const clientIds = result.clients.map(c => c._id);
  const allSites = await Site.find({ client: { $in: clientIds } }).lean();

  // Group sites by client
  const sitesByClient = {};
  allSites.forEach(site => {
    const clientId = site.client.toString();
    if (!sitesByClient[clientId]) sitesByClient[clientId] = [];
    sitesByClient[clientId].push(site);
  });

  const clients = result.clients.map(client => {
    const clientSites = sitesByClient[client._id.toString()] || [];

    return {
      id: client._id,
      companyName: client.companyName,
      tradingName: client.tradingName,
      status: client.status,
      industry: client.industry,
      logoUrl: client.logoUrl,
      address: client.address,
      contacts: (client.contacts || []).map(c => ({
        id: c._id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        jobTitle: c.jobTitle,
        isPrimary: c.isPrimary,
      })),
      primaryContact: client.contacts?.find(c => c.isPrimary) || client.contacts?.[0] || null,
      sites: clientSites.map(s => ({
        id: s._id,
        name: s.name,
        address: s.address,
        siteType: s.siteType,
        status: s.status,
        guardsAssigned: s.guardsRequired || 0,
        shiftsThisWeek: 0,
        hasGeofence: !!s.geofence?.center,
      })),
      totalSites: clientSites.length,
      activeSites: clientSites.filter(s => s.status === 'active').length,
      totalGuardsAssigned: 0,
      incidentsThisMonth: 0,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      lastActivityAt: client.lastActivityAt,
    };
  });

  res.json({ clients, pagination: result.pagination });
});


// GET /api/clients/:id
const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid client ID');
  }

  const client = await Client.findById(id);
  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  // Fetch sites for this client
  const sites = await Site.find({ client: id }).lean();

  res.json({
    id: client._id,
    companyName: client.companyName,
    tradingName: client.tradingName,
    status: client.status,
    industry: client.industry,
    logoUrl: client.logoUrl,
    address: client.address,
    contacts: client.contacts.map(c => ({
      id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      jobTitle: c.jobTitle,
      isPrimary: c.isPrimary,
    })),
    primaryContact: client.contacts.find(c => c.isPrimary) || client.contacts[0] || null,
    sites: sites.map(s => ({
      id: s._id,
      name: s.name,
      address: s.address,
      siteType: s.siteType,
      status: s.status,
      guardsAssigned: s.guardsRequired || 0,
      shiftsThisWeek: 0,
      hasGeofence: !!s.geofence?.center,
    })),
    totalSites: sites.length,
    activeSites: sites.filter(s => s.status === 'active').length,
    totalGuardsAssigned: 0,
    incidentsThisMonth: 0,
    notes: client.notes,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    lastActivityAt: client.lastActivityAt,
  });
});

// POST /api/clients
const createClient = asyncHandler(async (req, res) => {
  const { companyName, tradingName, status, industry, address, primaryContact, notes } = req.body;

  if (!companyName) {
    res.status(400);
    throw new Error('Company name is required');
  }
  if (!address || !address.street || !address.city || !address.postCode) {
    res.status(400);
    throw new Error('Complete address is required');
  }
  if (!primaryContact || !primaryContact.firstName || !primaryContact.lastName || !primaryContact.email || !primaryContact.phone) {
    res.status(400);
    throw new Error('Primary contact details are required');
  }

  const existing = await Client.findOne({ companyName: { $regex: new RegExp(`^${companyName}$`, 'i') } });
  if (existing) {
    res.status(400);
    throw new Error('Client with this name already exists');
  }

  const client = new Client({
    companyName,
    tradingName,
    status: status || 'prospect',
    industry,
    address,
    contacts: [{ ...primaryContact, isPrimary: true }],
    notes,
    createdBy: req.user._id,
    lastActivityAt: new Date(),
  });

  await client.save();
  res.status(201).json({ id: client._id, companyName: client.companyName, status: client.status });
});

// PUT /api/clients/:id
const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid client ID');
  }

  const client = await Client.findById(id);
  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  const allowed = ['companyName', 'tradingName', 'status', 'industry', 'logoUrl', 'address', 'notes'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) client[field] = req.body[field];
  });
  client.lastActivityAt = new Date();
  await client.save();

  res.json({ id: client._id, companyName: client.companyName, status: client.status });
});

// DELETE /api/clients/:id (soft delete)
const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid client ID');
  }

  const client = await Client.findById(id);
  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  client.status = 'inactive';
  client.lastActivityAt = new Date();
  await client.save();

  res.json({ id: client._id, message: 'Client deactivated' });
});

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };