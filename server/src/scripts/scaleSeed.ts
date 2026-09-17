import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember } from '../models/WorkspaceMember';
import { Project } from '../models/Project';
import { ProjectMember } from '../models/ProjectMember';
import { Board } from '../models/Board';
import { BoardColumn } from '../models/BoardColumn';
import { Sprint } from '../models/Sprint';
import { Issue } from '../models/Issue';
import { Comment } from '../models/Comment';

const BATCH_SIZE = 1000;

async function scaleSeed() {
  console.log('🚀 Starting ProjectPilot high-scale performance benchmark seed...');
  await connectDatabase();

  const startTime = Date.now();

  // Clean existing scale test data if flag provided
  const shouldClean = process.argv.includes('--clean');
  if (shouldClean) {
    console.log('🧹 Cleaning existing performance seed data...');
    await Promise.all([
      User.deleteMany({ email: /scale_.*@projectpilot\.dev/ }),
      Workspace.deleteMany({ slug: /scale-ws-.*/ }),
      Issue.deleteMany({ key: /SCALE-.*/ }),
    ]);
  }

  // 1. Create 100 benchmark users
  console.log('👤 Seeding 100 users in batch...');
  const passwordHash = await bcrypt.hash('Password123!', 8);
  const userDocs = [];
  for (let i = 1; i <= 100; i++) {
    userDocs.push({
      name: `Benchmark User ${i}`,
      email: `scale_user_${i}@projectpilot.dev`,
      passwordHash,
      isEmailVerified: true,
      timezone: 'UTC',
    });
  }
  const createdUsers = await User.insertMany(userDocs);
  const primaryOwner = createdUsers[0]._id;

  // 2. Create Workspaces & 100 Projects
  console.log('🏢 Seeding Workspaces & 100 Projects...');
  const ws = await Workspace.create({
    name: 'Scale Benchmark Workspace',
    slug: `scale-ws-${Date.now()}`,
    owner: primaryOwner,
    description: 'Workspace generated for high-scale concurrency and performance benchmarking.',
  });

  const wsMemberDocs = createdUsers.map((u) => ({
    workspace: ws._id,
    user: u._id,
    role: u._id.equals(primaryOwner) ? 'owner' : 'member',
  }));
  await WorkspaceMember.insertMany(wsMemberDocs);

  const projectDocs = [];
  for (let i = 1; i <= 100; i++) {
    projectDocs.push({
      workspace: ws._id,
      name: `Scale Project ${i}`,
      key: `SP${i}`,
      lead: createdUsers[i % createdUsers.length]._id,
      status: 'active',
      lastIssueNumber: 100,
    });
  }
  const createdProjects = await Project.insertMany(projectDocs);

  // 3. Create Boards and Sprints
  console.log('📋 Creating Boards and 500 Sprints...');
  const boardDocs = createdProjects.map((p) => ({
    project: p._id,
    name: `${p.name} Board`,
  }));
  const createdBoards = await Board.insertMany(boardDocs);

  const columnDocs: any[] = [];
  createdBoards.forEach((b) => {
    columnDocs.push(
      { board: b._id, name: 'To Do', status: 'todo', color: '#6B7280', position: 0 },
      { board: b._id, name: 'In Progress', status: 'in_progress', color: '#3B82F6', position: 1 },
      { board: b._id, name: 'In Review', status: 'review', color: '#F59E0B', position: 2 },
      { board: b._id, name: 'Done', status: 'done', color: '#10B981', position: 3 }
    );
  });
  await BoardColumn.insertMany(columnDocs);

  const sprintDocs = [];
  for (let i = 0; i < 500; i++) {
    const proj = createdProjects[i % createdProjects.length];
    sprintDocs.push({
      project: proj._id,
      name: `Sprint ${Math.floor(i / 100) + 1}`,
      status: i % 5 === 0 ? 'active' : i % 5 === 1 ? 'completed' : 'planned',
      startDate: new Date(Date.now() - 86400000 * 7),
      endDate: new Date(Date.now() + 86400000 * 7),
    });
  }
  const createdSprints = await Sprint.insertMany(sprintDocs);

  // 4. Create 10,000 Issues in chunks of 1,000
  console.log('🎯 Seeding 10,000 Issues with OCC versioning in chunks...');
  const priorities = ['lowest', 'low', 'medium', 'high', 'highest'];
  const types = ['task', 'bug', 'story', 'epic'];
  const statuses = ['todo', 'in_progress', 'review', 'done'];

  for (let chunk = 0; chunk < 10; chunk++) {
    const issueBatch = [];
    for (let i = 1; i <= 1000; i++) {
      const idx = chunk * 1000 + i;
      const proj = createdProjects[idx % createdProjects.length];
      const sprint = createdSprints[idx % createdSprints.length];
      const assignee = createdUsers[idx % createdUsers.length]._id;
      const reporter = createdUsers[(idx + 1) % createdUsers.length]._id;

      issueBatch.push({
        project: proj._id,
        key: `SCALE-${idx}`,
        title: `Scale benchmark issue #${idx} - Concurrency and filter performance test`,
        description: `Synthetic issue created for query analyzer indexing validation. High concurrency index test.`,
        type: types[idx % types.length],
        status: statuses[idx % statuses.length],
        priority: priorities[idx % priorities.length],
        reporter,
        assignee,
        sprint: sprint._id,
        position: (idx % 100) * 1000,
        storyPoints: (idx % 8) + 1,
        version: 1,
      });
    }
    await Issue.insertMany(issueBatch);
    console.log(`   ✓ Ingested chunk ${chunk + 1}/10 (${(chunk + 1) * 1000} issues)`);
  }

  // 5. Index and Query Performance Explain Check
  console.log('🔍 Running MongoDB explain plan performance diagnostics...');
  const testQuery = {
    project: createdProjects[0]._id,
    status: 'in_progress',
  };
  const explain = await Issue.find(testQuery).sort({ position: 1 }).explain('executionStats');
  const stage = (explain as any).executionStats?.executionStages?.stage || 'UNKNOWN';
  const totalDocsExamined = (explain as any).executionStats?.totalDocsExamined ?? 0;
  console.log(`   📊 Query Plan Winning Stage: ${stage}`);
  console.log(`   📊 Total Docs Examined: ${totalDocsExamined}`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 High-scale benchmark seed completed in ${durationSec}s!`);
  console.log(`   - Users: 100`);
  console.log(`   - Projects: 100`);
  console.log(`   - Sprints: 500`);
  console.log(`   - Issues: 10,000`);
  process.exit(0);
}

scaleSeed().catch((err) => {
  console.error('Scale seed encountered error:', err);
  process.exit(1);
});
