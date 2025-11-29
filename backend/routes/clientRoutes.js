/**
 * Client Routes
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../controllers/clientController');

router.get('/', authMiddleware, getClients);
router.get('/:id', authMiddleware, getClientById);
router.post('/', authMiddleware, roleMiddleware(['Manager', 'Admin']), createClient);
router.put('/:id', authMiddleware, roleMiddleware(['Manager', 'Admin']), updateClient);
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), deleteClient);

module.exports = router;