import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logAdminAction } from '../middleware/adminLog.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

const KNOWN_SETTING_KEYS = [
  'avatarGenerationEnabled',
  'gamesEnabled',
  'listeningEnabled',
  'registrationOpen',
];

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const listUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/admin/users
router.get('/users', validate({ query: listUsersQuerySchema }), async (req, res, next) => {
  try {
    const { search, page, pageSize } = req.query;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users: users.map(publicUser),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    next(err);
  }
});

const patchUserParamsSchema = z.object({
  id: z.string().trim().min(1),
});

const patchUserBodySchema = z.object({
  blocked: z.boolean().optional(),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN']).optional(),
  level: z.string().trim().min(1).max(10).optional(),
});

// PATCH /api/admin/users/:id
router.patch(
  '/users/:id',
  validate({ params: patchUserParamsSchema, body: patchUserBodySchema }),
  async (req, res, next) => {
    try {
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: req.body,
      });

      await logAdminAction({
        actorId: req.user.id,
        action: 'user.update',
        target: req.params.id,
      });

      res.json({ user: publicUser(updated) });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/admin/users/:id
router.delete(
  '/users/:id',
  validate({ params: patchUserParamsSchema }),
  async (req, res, next) => {
    try {
      const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Lockout prevention: an admin cannot delete their own account
      // (and thereby leave the school without administration).
      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }

      await prisma.user.delete({ where: { id: req.params.id } });

      await logAdminAction({
        actorId: req.user.id,
        action: 'user.delete',
        target: req.params.id,
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// GET /api/admin/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate in the database: Attempt grows by one row per answer per child,
    // so loading full tables would eventually exhaust memory.
    const [totalUsers, totalStudents, totalAttempts, totalCorrect, activeUsers, byTypeAll, byTypeCorrect, topTopicRows, recentTimestamps] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.attempt.count(),
      prisma.attempt.count({ where: { correct: true } }),
      prisma.attempt.groupBy({ by: ['userId'], where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.attempt.groupBy({ by: ['taskType'], _count: { _all: true } }),
      prisma.attempt.groupBy({ by: ['taskType'], _count: { _all: true }, where: { correct: true } }),
      prisma.attempt.groupBy({ by: ['topic'], _count: { _all: true }, orderBy: { _count: { topic: 'desc' } }, take: 5 }),
      prisma.attempt.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
    ]);

    const correctByType = new Map(byTypeCorrect.map((row) => [row.taskType, row._count._all]));
    const byTaskType = {};
    const avgAccuracyByTaskType = {};
    for (const row of byTypeAll) {
      const total = row._count._all;
      const correct = correctByType.get(row.taskType) || 0;
      byTaskType[row.taskType] = { total, correct };
      avgAccuracyByTaskType[row.taskType] = total > 0 ? correct / total : 0;
    }

    // Attempts per day, last 30 days (bounded query, timestamps only).
    const perDayMap = {};
    for (const { createdAt } of recentTimestamps) {
      const key = dayKey(createdAt);
      perDayMap[key] = (perDayMap[key] || 0) + 1;
    }
    const attemptsPerDay = Object.entries(perDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const topTopics = topTopicRows.map((row) => ({ topic: row.topic, count: row._count.topic }));

    res.json({
      totals: {
        users: totalUsers,
        students: totalStudents,
        attempts: totalAttempts,
        overallAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
      },
      activeLast7d: activeUsers.length,
      avgAccuracyByTaskType,
      byTaskType,
      attemptsPerDay,
      topTopics,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// GET /api/admin/settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({});
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

const putSettingSchema = z.object({
  key: z.enum(KNOWN_SETTING_KEYS),
  value: z.string().trim().min(1).max(500),
});

// PUT /api/admin/settings
router.put('/settings', validate({ body: putSettingSchema }), async (req, res, next) => {
  try {
    const { key, value } = req.body;

    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    await logAdminAction({
      actorId: req.user.id,
      action: 'setting.update',
      target: key,
    });

    res.json({ setting });
  } catch (err) {
    next(err);
  }
});

export default router;
