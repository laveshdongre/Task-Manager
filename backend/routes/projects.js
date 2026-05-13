const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return null;
};

// GET /api/projects — all projects the user is a member of
router.get('/', protect, async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
], async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const { name, description, color, dueDate } = req.body;
    const project = await Project.create({
      name, description, color, dueDate,
      owner: req.user._id,
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId
router.get('/:projectId', protect, requireProjectMember, async (req, res) => {
  await req.project.populate('owner', 'name email avatar');
  await req.project.populate('members.user', 'name email avatar');
  res.json({ success: true, project: req.project, role: req.memberRole });
});

// PUT /api/projects/:projectId
router.put('/:projectId', protect, requireProjectMember, requireProjectAdmin, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
], async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const allowed = ['name', 'description', 'color', 'status', 'dueDate'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const project = await Project.findByIdAndUpdate(req.params.projectId, updates, { new: true, runValidators: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId
router.delete('/:projectId', protect, requireProjectMember, requireProjectAdmin, async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/members — invite by email
router.post('/:projectId/members', protect, requireProjectMember, requireProjectAdmin, [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('role').optional().isIn(['admin', 'member']),
], async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const { email, role = 'member' } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'No user found with that email.' });
    }

    const alreadyMember = req.project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member.' });
    }

    req.project.members.push({ user: userToAdd._id, role });
    await req.project.save();
    await req.project.populate('members.user', 'name email avatar');

    res.json({ success: true, members: req.project.members });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', protect, requireProjectMember, requireProjectAdmin, async (req, res, next) => {
  try {
    if (req.params.userId === req.project.owner.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner.' });
    }

    req.project.members = req.project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await req.project.save();

    res.json({ success: true, message: 'Member removed.' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:projectId/members/:userId/role
router.put('/:projectId/members/:userId/role', protect, requireProjectMember, requireProjectAdmin, [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
], async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const member = req.project.members.find(
      (m) => m.user.toString() === req.params.userId
    );
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.role = req.body.role;
    await req.project.save();
    await req.project.populate('members.user', 'name email avatar');

    res.json({ success: true, members: req.project.members });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
