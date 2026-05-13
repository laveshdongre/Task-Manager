const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — aggregated stats for the current user
router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Projects user is in
    const projects = await Project.find({ 'members.user': userId }).select('_id name color status');
    const projectIds = projects.map((p) => p._id);

    // All tasks across those projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .sort({ dueDate: 1 });

    const myTasks = allTasks.filter(
      (t) => t.assignedTo?._id?.toString() === userId.toString()
    );

    const now = new Date();
    const overdue = myTasks.filter((t) => t.dueDate && t.status !== 'done' && t.dueDate < now);
    const dueToday = myTasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.toDateString() === now.toDateString() && t.status !== 'done';
    });

    const statusCounts = {
      todo: myTasks.filter((t) => t.status === 'todo').length,
      'in-progress': myTasks.filter((t) => t.status === 'in-progress').length,
      review: myTasks.filter((t) => t.status === 'review').length,
      done: myTasks.filter((t) => t.status === 'done').length,
    };

    const priorityCounts = {
      critical: myTasks.filter((t) => t.priority === 'critical').length,
      high: myTasks.filter((t) => t.priority === 'high').length,
      medium: myTasks.filter((t) => t.priority === 'medium').length,
      low: myTasks.filter((t) => t.priority === 'low').length,
    };

    res.json({
      success: true,
      stats: {
        totalProjects: projects.length,
        totalTasks: myTasks.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        completed: statusCounts.done,
        statusCounts,
        priorityCounts,
      },
      recentTasks: myTasks.slice(0, 8),
      overdueTasks: overdue.slice(0, 5),
      projects,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
