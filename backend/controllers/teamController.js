const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/team
exports.getAllMembers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').lean();
    // Optionally, populate assignedProjects and compute stats
    for (const user of users) {
      user.projectCount = user.assignedProjects?.length || 0;
      user.activeTasks = await Task.countDocuments({ assignedTo: user._id, status: { $ne: 'done' } });
      user.projects = await Project.find({ members: { $elemMatch: { user: user._id } } }, 'name _id');
    }
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch team members.' });
  }
};

// GET /api/team/:id
exports.getMemberById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.projects = await Project.find({ members: { $elemMatch: { user: user._id } } }, 'name _id');
    user.tasks = await Task.find({ assignedTo: user._id }, 'title status project');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch member.' });
  }
};

// PATCH /api/team/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, availability } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (status) user.status = status;
    if (availability) user.availability = availability;
    user.lastSeen = new Date();
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

// PATCH /api/team/role/:id
exports.updateRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can change roles.' });
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.role = role;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
};

// DELETE /api/team/:id
exports.removeMember = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can remove members.' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'Member removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
};
