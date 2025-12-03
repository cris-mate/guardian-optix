/**
 * Activity Hub Routes
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getActivities,
  getUpdates,
  getStats,
  createUpdate,
  markUpdateRead,
  acknowledgeUpdate,
} = require('../controllers/activityHubController');

router.use(authMiddleware);

router.get('/activities', getActivities);
router.get('/stats', getStats);
router.get('/updates', getUpdates);
router.post('/updates', roleMiddleware('Manager', 'Admin'), createUpdate);
router.patch('/updates/:id/read', markUpdateRead);
router.patch('/updates/:id/acknowledge', acknowledgeUpdate);

module.exports = router;