/**
 * Incident Routes
 *
 * API endpoints for incident management and ML-powered severity prediction.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const Incident = require('../models/Incident');
const {
  predictSeverity,
  getPatternInsights,
} = require('../services/incidentPredictor');

// All incident routes require authentication
router.use(authMiddleware);

// ============================================
// ML Prediction Routes
// ============================================

/**
 * @route   POST /api/incidents/predict-severity
 * @desc    Get ML-based severity prediction for new incident
 * @access  Private
 */
router.post(
  '/predict-severity',
  asyncHandler(async (req, res) => {
    const { incidentType, timestamp } = req.body;

    if (!incidentType) {
      res.status(400);
      throw new Error('incidentType is required');
    }

    const prediction = await predictSeverity({ incidentType, timestamp });

    res.json({
      success: true,
      data: prediction,
    });
  })
);

/**
 * @route   GET /api/incidents/pattern-insights
 * @desc    Get incident pattern analysis for dashboard
 * @access  Private (Manager/Admin)
 */
router.get(
  '/pattern-insights',
  roleMiddleware(['Manager', 'Admin']),
  asyncHandler(async (req, res) => {
    const insights = await getPatternInsights();

    res.json({
      success: true,
      data: insights,
    });
  })
);

// ============================================
// CRUD Routes
// ============================================

/**
 * @route   GET /api/incidents
 * @desc    Get all incidents with filtering
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      status,
      severity,
      incidentType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (severity && severity !== 'all') filter.severity = severity;
    if (incidentType && incidentType !== 'all') filter.incidentType = incidentType;

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate('reportedBy', 'fullName email')
        .populate('resolvedBy', 'fullName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Incident.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: incidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

/**
 * @route   GET /api/incidents/:id
 * @desc    Get single incident by ID
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'fullName email phoneNumber')
      .populate('resolvedBy', 'fullName')
      .lean();

    if (!incident) {
      res.status(404);
      throw new Error('Incident not found');
    }

    res.json({
      success: true,
      data: incident,
    });
  })
);

/**
 * @route   POST /api/incidents
 * @desc    Create new incident
 * @access  Private
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      location,
      incidentType,
      severity,
      description,
      witnesses,
      evidenceUrls,
    } = req.body;

    // Validation
    if (!location || !incidentType || !severity || !description) {
      res.status(400);
      throw new Error('location, incidentType, severity, and description are required');
    }

    const incident = await Incident.create({
      reportedBy: req.user._id,
      location,
      incidentType,
      severity,
      description,
      witnesses: witnesses || [],
      evidenceUrls: evidenceUrls || [],
      status: 'open',
    });

    const populated = await Incident.findById(incident._id)
      .populate('reportedBy', 'fullName email')
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Incident reported successfully',
    });
  })
);

/**
 * @route   PATCH /api/incidents/:id
 * @desc    Update incident
 * @access  Private (Manager/Admin)
 */
router.patch(
  '/:id',
  roleMiddleware(['Manager', 'Admin']),
  asyncHandler(async (req, res) => {
    const { status, actionTaken, severity } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      res.status(404);
      throw new Error('Incident not found');
    }

    // Update fields
    if (status) incident.status = status;
    if (actionTaken) incident.actionTaken = actionTaken;
    if (severity) incident.severity = severity;

    // Mark as resolved if status changed to resolved/closed
    if (status === 'resolved' || status === 'closed') {
      incident.resolvedBy = req.user._id;
      incident.resolvedAt = new Date();
    }

    await incident.save();

    const updated = await Incident.findById(incident._id)
      .populate('reportedBy', 'fullName email')
      .populate('resolvedBy', 'fullName')
      .lean();

    res.json({
      success: true,
      data: updated,
      message: 'Incident updated successfully',
    });
  })
);

/**
 * @route   DELETE /api/incidents/:id
 * @desc    Delete incident
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  roleMiddleware(['Admin']),
  asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      res.status(404);
      throw new Error('Incident not found');
    }

    await incident.deleteOne();

    res.json({
      success: true,
      message: 'Incident deleted successfully',
    });
  })
);

module.exports = router;