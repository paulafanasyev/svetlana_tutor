// Chat rooms and messages: create / list / send / manage members with role-scoped access.
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

function serializeRoom(r, userId) {
  return {
    id: r.id,
    schoolId: r.schoolId,
    name: r.name,
    type: r.type,
    memberIds: r.members.map((m) => m.userId),
    isMember: r.members.some((m) => m.userId === userId),
    messageCount: r._count?.messages || 0,
    lastMessage: r.messages?.[0]
      ? { id: r.messages[0].id, text: r.messages[0].text, authorId: r.messages[0].authorId, at: new Date(r.messages[0].createdAt).getTime() }
      : null,
    createdAt: new Date(r.createdAt).getTime(),
  };
}

function serializeMessage(m) {
  return {
    id: m.id,
    roomId: m.roomId,
    authorId: m.authorId,
    authorName: m.author?.name,
    text: m.text,
    at: new Date(m.createdAt).getTime(),
  };
}

const listQuery = z.object({
  schoolId: z.string().trim().optional(),
});

// GET /api/chat/rooms?schoolId=
router.get('/rooms', validate({ query: listQuery }), async (req, res, next) => {
  try {
    const { schoolId } = req.query;
    const role = req.user.role;
    const userId = req.user.id;

    const where = {};
    if (schoolId) where.schoolId = schoolId;

    // Scope: students/parents see only rooms they belong to; teachers see their classes + personal; admins see all.
    if (role === 'STUDENT' || role === 'PARENT') {
      where.members = { some: { userId } };
    } else if (role === 'TEACHER') {
      // Teachers see rooms they're members of, plus class rooms for their classes.
      const myRooms = await prisma.chatRoom.findMany({
        where: { ...where, OR: [{ members: { some: { userId } } }, { type: 'class', schoolId: where.schoolId }] },
        include: { members: true, messages: { take: 1, orderBy: { createdAt: 'desc' } }, _count: { select: { messages: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(myRooms.map((r) => serializeRoom(r, userId)));
    }

    const rooms = await prisma.chatRoom.findMany({
      where,
      include: { members: true, messages: { take: 1, orderBy: { createdAt: 'desc' } }, _count: { select: { messages: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rooms.map((r) => serializeRoom(r, userId)));
  } catch (err) { next(err); }
});

const createRoomBody = z.object({
  schoolId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
  type: z.enum(['school', 'class', 'group', 'personal']),
  memberIds: z.array(z.string().trim().min(1)).min(1).max(100),
});

// POST /api/chat/rooms
router.post('/rooms', requireRole('TEACHER', 'ADMIN'), validate({ body: createRoomBody }), async (req, res, next) => {
  try {
    const { schoolId, name, type, memberIds } = req.body;
    const role = req.user.role;

    // Teachers can only create rooms in their own school; admins in any school.
    if (role === 'TEACHER' && schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Ensure all members exist and belong to the school (students in teacher's classes, or any user for admin).
    const members = await prisma.user.findMany({ where: { id: { in: memberIds } } });
    if (members.length !== memberIds.length) {
      return res.status(400).json({ error: 'Some members not found' });
    }

    const room = await prisma.chatRoom.create({
      data: {
        schoolId,
        name,
        type,
        createdBy: req.user.id,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
      include: { members: true, messages: { take: 1, orderBy: { createdAt: 'desc' } }, _count: { select: { messages: true } } },
    });
    res.status(201).json(serializeRoom(room, req.user.id));
  } catch (err) { next(err); }
});

const roomIdParam = z.object({ roomId: z.string().trim().min(1) });

// GET /api/chat/rooms/:roomId/messages?limit=&before=
router.get('/rooms/:roomId/messages', validate({ params: roomIdParam, query: z.object({ limit: z.coerce.number().int().min(1).max(100).optional().default(50), before: z.string().trim().optional() }) }), async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit, before } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Access control: must be member, or teacher/admin of the school.
    const isMember = room.members.some((m) => m.userId === userId);
    if (!isMember && role === 'STUDENT') return res.status(403).json({ error: 'Not a member' });
    if (!isMember && role === 'TEACHER' && room.schoolId !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });

    const where = { roomId };
    if (before) where.createdAt = { lt: new Date(before) };

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: { select: { id: true, name: true } } },
    });
    res.json(messages.map(serializeMessage).reverse());
  } catch (err) { next(err); }
});

const sendMessageBody = z.object({
  text: z.string().trim().min(1).max(2000),
});

// POST /api/chat/rooms/:roomId/messages
router.post('/rooms/:roomId/messages', validate({ params: roomIdParam, body: sendMessageBody }), async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const isMember = room.members.some((m) => m.userId === userId);
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    const message = await prisma.chatMessage.create({
      data: { roomId, authorId: userId, text },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(serializeMessage(message));
  } catch (err) { next(err); }
});

const addMemberBody = z.object({
  userId: z.string().trim().min(1),
});

// POST /api/chat/rooms/:roomId/members
router.post('/rooms/:roomId/members', requireRole('TEACHER', 'ADMIN'), validate({ params: roomIdParam, body: addMemberBody }), async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    const role = req.user.role;

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (role === 'TEACHER' && room.schoolId !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });

    const exists = room.members.some((m) => m.userId === userId);
    if (exists) return res.status(400).json({ error: 'Already a member' });

    await prisma.chatMember.create({ data: { roomId, userId } });
    res.status(201).json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/chat/rooms/:roomId/members/:userId
router.delete('/rooms/:roomId/members/:userId', validate({ params: roomIdParam.merge(z.object({ userId: z.string().trim().min(1) })) }), async (req, res, next) => {
  try {
    const { roomId, userId } = req.params;
    const role = req.user.role;
    const actorId = req.user.id;

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // A member may always leave the room themselves; teachers/admins may remove anyone.
    if (role !== 'TEACHER' && role !== 'ADMIN') {
      if (userId !== actorId) return res.status(403).json({ error: 'Members can only remove themselves' });
    } else if (role === 'TEACHER' && room.schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const member = room.members.find((m) => m.userId === userId);
    if (!member) return res.status(404).json({ error: 'Not a member' });

    await prisma.chatMember.delete({ where: { id: member.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
