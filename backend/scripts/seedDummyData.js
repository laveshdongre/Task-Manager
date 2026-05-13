/**
 * Demo dataset: admin + member + extra user (for invite flow), 1 project, varied tasks.
 *
 *   npm run seed          — insert once; skips if demo project exists
 *   npm run seed:reset    — remove old demo rows, then insert fresh data
 *
 * Login after seed (same password for all three):
 *   Admin (owner, project admin — invite/remove members):  demo-admin@taskflow.test  /  DemoSeed123!
 *   Member (already on team — admin can remove later):    demo-member@taskflow.test /  DemoSeed123!
 *   Extra (registered, NOT on project — admin invites):   demo-invite@taskflow.test /  DemoSeed123!
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const DEMO_PROJECT_NAME = 'Seed Demo — Product Launch';
const RESET = process.argv.includes('--reset');

const DEMO_USERS = [
  { name: 'Alex Admin', email: 'demo-admin@taskflow.test', password: 'DemoSeed123!' },
  { name: 'Blake Member', email: 'demo-member@taskflow.test', password: 'DemoSeed123!' },
  { name: 'Casey Invite', email: 'demo-invite@taskflow.test', password: 'DemoSeed123!' },
];

const DEMO_EMAILS = DEMO_USERS.map((u) => u.email);

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function clearDemoData() {
  const project = await Project.findOne({ name: DEMO_PROJECT_NAME });
  if (project) {
    const taskRes = await Task.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id });
    console.log(`Removed demo project and ${taskRes.deletedCount} task(s).`);
  }
  const userRes = await User.deleteMany({ email: { $in: DEMO_EMAILS } });
  if (userRes.deletedCount > 0) {
    console.log(`Removed ${userRes.deletedCount} demo user(s).`);
  }
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  if (RESET) {
    await clearDemoData();
    console.log('Reset complete. Inserting fresh demo data...\n');
  } else {
    const existing = await Project.findOne({ name: DEMO_PROJECT_NAME });
    if (existing) {
      console.log('Demo data already present (project exists). Run npm run seed:reset to replace.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  const [adminDef, memberDef, inviteDef] = DEMO_USERS;
  let admin = await User.findOne({ email: adminDef.email });
  let member = await User.findOne({ email: memberDef.email });
  let inviteUser = await User.findOne({ email: inviteDef.email });

  if (!admin) {
    admin = await User.create({
      name: adminDef.name,
      email: adminDef.email,
      password: adminDef.password,
    });
    console.log('Created user:', admin.email);
  }
  if (!member) {
    member = await User.create({
      name: memberDef.name,
      email: memberDef.email,
      password: memberDef.password,
    });
    console.log('Created user:', member.email);
  }
  if (!inviteUser) {
    inviteUser = await User.create({
      name: inviteDef.name,
      email: inviteDef.email,
      password: inviteDef.password,
    });
    console.log('Created user:', inviteUser.email, '(not added to project — use admin to invite)');
  }

  // Admin + member only; Casey is registered but not in members[] (invite flow).
  const project = await Project.create({
    name: DEMO_PROJECT_NAME,
    description:
      'Demo: overdue + done + assigned tasks. Log in as Alex Admin to invite Casey or remove Blake.',
    color: '#6366f1',
    owner: admin._id,
    members: [
      { user: admin._id, role: 'admin' },
      { user: member._id, role: 'member' },
    ],
    status: 'active',
  });
  console.log('Created project:', project.name);

  const tasks = await Task.insertMany([
    {
      title: 'Ship v1 release checklist',
      description: 'Completed launch tasks — shows Done column.',
      project: project._id,
      createdBy: admin._id,
      assignedTo: member._id,
      status: 'done',
      priority: 'high',
      dueDate: daysFromNow(-2),
      tags: ['release', 'done'],
    },
    {
      title: 'Fix overdue auth bug',
      description: 'Past due date, still open — shows as overdue on cards.',
      project: project._id,
      createdBy: admin._id,
      assignedTo: member._id,
      status: 'todo',
      priority: 'critical',
      dueDate: daysFromNow(-10),
      tags: ['backend', 'overdue'],
    },
    {
      title: 'Kanban drag polish',
      description: 'Admin owns this task; due later.',
      project: project._id,
      createdBy: admin._id,
      assignedTo: admin._id,
      status: 'in-progress',
      priority: 'medium',
      dueDate: daysFromNow(7),
      tags: ['frontend'],
    },
    {
      title: 'Stakeholder demo deck',
      description: 'Due today if not marked done — dashboard “due today”.',
      project: project._id,
      createdBy: member._id,
      assignedTo: admin._id,
      status: 'review',
      priority: 'high',
      dueDate: daysFromNow(0),
      tags: ['docs'],
    },
    {
      title: 'Backlog: analytics export',
      description: 'Unassigned — assign from card as admin/creator.',
      project: project._id,
      createdBy: admin._id,
      assignedTo: null,
      status: 'todo',
      priority: 'low',
      dueDate: daysFromNow(21),
      tags: ['backlog'],
    },
    {
      title: 'QA regression suite',
      description: 'Member-assigned; upcoming deadline.',
      project: project._id,
      createdBy: admin._id,
      assignedTo: member._id,
      status: 'in-progress',
      priority: 'medium',
      dueDate: daysFromNow(5),
      tags: ['qa'],
    },
  ]);

  console.log(`Created ${tasks.length} tasks.`);

  console.log('\n--- Demo logins (password for all: DemoSeed123!) ---');
  console.log('Admin (invite/remove): ', adminDef.email);
  console.log('Member (on team):      ', memberDef.email);
  console.log('Extra (invite only):   ', inviteDef.email);
  console.log('\nTip: Open Team → invite', inviteDef.email, '→ remove', memberDef.email, 'to try both flows.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
