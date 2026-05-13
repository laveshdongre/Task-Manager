const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { protect, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return null;
};

// GET /api/projects/:projectId/tasks
router.get('/', protect, requireProjectMember, async (req, res, next) => {
  try {
    const filter = { project: req.params.projectId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/tasks
router.post('/', protect, requireProjectMember, [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 150 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('assignedTo').optional().isMongoId(),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('tags').optional().isArray(),
], async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    // Validate assignedTo is a project member
    if (req.body.assignedTo) {
      const isMember = req.project.members.some(
        (m) => m.user.toString() === req.body.assignedTo
      );
      if (!isMember) {
        return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
      }
    }

    const task = await Task.create({
      ...req.body,
      project: req.params.projectId,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/tasks/:taskId
router.get('/:taskId', protect, requireProjectMember, async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:projectId/tasks/:taskId
router.put('/:taskId', protect, requireProjectMember, [
  body('title').optional().trim().notEmpty().isLength({ max: 150 }),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('assignedTo').optional({ nullable: true }).isMongoId(),
  body('dueDate').optional({ nullable: true }).isISO8601(),
], async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Only admin or task creator can update
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (req.memberRole !== 'admin' && !isCreator) {
      // Members can still update status if assigned to them
      const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
      const allowedFields = ['status'];
      const requestedFields = Object.keys(req.body);
      const hasDisallowedFields = requestedFields.some((f) => !allowedFields.includes(f));

      if (!isAssignee || hasDisallowedFields) {
        return res.status(403).json({ success: false, message: 'Only admins or task creators can update this task.' });
      }
    }

    const allowed = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'tags'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await Task.findByIdAndUpdate(req.params.taskId, updates, { new: true, runValidators: true })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    res.json({ success: true, task: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete('/:taskId', protect, requireProjectMember, async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (req.memberRole !== 'admin' && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only admins or task creators can delete tasks.' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/tasks/:taskId/comments
router.post('/:taskId/comments', protect, requireProjectMember, [
  body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 500 }),
], async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');

    res.status(201).json({ success: true, comments: task.comments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
