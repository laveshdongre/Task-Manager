const express = require('express');
const { protect } = require('../middleware/auth');
const teamController = require('../controllers/teamController');

const router = express.Router();

// Get all team members
router.get('/', protect, teamController.getAllMembers);

// Get a single member by ID
router.get('/:id', protect, teamController.getMemberById);

// Update member status (self or admin)
router.patch('/status', protect, teamController.updateStatus);

// Update member role (admin only)
router.patch('/role/:id', protect, teamController.updateRole);

// Remove member (admin only)
router.delete('/:id', protect, teamController.removeMember);

module.exports = router;
