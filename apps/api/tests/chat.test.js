import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { signAccessToken, hashPassword } from './setup.js';

const app = createApp();

describe('Chat API', () => {
  let adminToken, teacherToken, studentToken, student2Token, parentToken, teacher2Token;
  let admin, teacher, student, parent, student2, teacher2, student3;
  let roomId;

  beforeEach(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.chatMember.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.user.deleteMany();

    admin = await prisma.user.create({
      data: { email: 'admin@school.test', passwordHash: await hashPassword('admin123'), name: 'Admin', role: 'ADMIN', schoolId: 'school-1' },
    });
    teacher = await prisma.user.create({
      data: { email: 'teacher@school.test', passwordHash: await hashPassword('teacher123'), name: 'Teacher', role: 'TEACHER', schoolId: 'school-1' },
    });
    teacher2 = await prisma.user.create({
      data: { email: 'teacher2@school.test', passwordHash: await hashPassword('teacher123'), name: 'Teacher 2', role: 'TEACHER', schoolId: 'school-2' },
    });
    student = await prisma.user.create({
      data: { email: 'student@school.test', passwordHash: await hashPassword('student123'), name: 'Student', role: 'STUDENT', schoolId: 'school-1' },
    });
    student2 = await prisma.user.create({
      data: { email: 'student2@school.test', passwordHash: await hashPassword('student123'), name: 'Student 2', role: 'STUDENT', schoolId: 'school-1' },
    });
    student3 = await prisma.user.create({
      data: { email: 'student3@school.test', passwordHash: await hashPassword('student123'), name: 'Student 3', role: 'STUDENT', schoolId: 'school-2' },
    });
    parent = await prisma.user.create({
      data: { email: 'parent@school.test', passwordHash: await hashPassword('parent123'), name: 'Parent', role: 'PARENT', schoolId: 'school-1' },
    });

    adminToken = await signAccessToken({ sub: admin.id, role: admin.role });
    teacherToken = await signAccessToken({ sub: teacher.id, role: teacher.role });
    teacher2Token = await signAccessToken({ sub: teacher2.id, role: teacher2.role });
    studentToken = await signAccessToken({ sub: student.id, role: student.role });
    student2Token = await signAccessToken({ sub: student2.id, role: student2.role });
    parentToken = await signAccessToken({ sub: parent.id, role: parent.role });
  });

  afterEach(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.chatMember.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/chat/rooms', () => {
    it('creates a room (teacher)', async () => {
      const res = await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ schoolId: 'school-1', name: 'Class 5A', type: 'class', memberIds: [student.id, student2.id] })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Class 5A');
      expect(res.body.type).toBe('class');
      // The creator is always added to the room they created.
      expect(res.body.memberIds).toHaveLength(3);
      expect(res.body.memberIds).toContain(teacher.id);
      roomId = res.body.id;
    });

    it('rejects a teacher adding members from another school', async () => {
      await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ schoolId: 'school-1', name: 'Mixed school', type: 'group', memberIds: [student3.id] })
        .expect(403);
    });

    it('rejects teacher creating room in another school', async () => {
      await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ schoolId: 'school-2', name: 'Other school', type: 'group', memberIds: [student.id] })
        .expect(403);
    });

    it('rejects student creating room', async () => {
      await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ schoolId: 'school-1', name: 'Test', type: 'group', memberIds: [student2.id] })
        .expect(403);
    });

    it('validates required fields', async () => {
      await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ schoolId: 'school-1', name: '', type: 'class', memberIds: [] })
        .expect(400);
    });
  });

  describe('GET /api/chat/rooms', () => {
    beforeEach(async () => {
      const room = await prisma.chatRoom.create({
        data: { schoolId: 'school-1', name: 'Test Room', type: 'class', createdBy: teacher.id },
      });
      roomId = room.id;
      await prisma.chatMember.createMany({
        data: [{ roomId, userId: teacher.id }, { roomId, userId: student.id }],
      });
    });

    it('lists rooms for teacher', async () => {
      const res = await request(app)
        .get('/api/chat/rooms?schoolId=school-1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Test Room');
    });

    it('lists only member rooms for student', async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].isMember).toBe(true);
    });

    it('excludes non-member rooms from student', async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it("hides another school's class rooms from a teacher", async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('rejects a teacher listing rooms of another school', async () => {
      await request(app)
        .get('/api/chat/rooms?schoolId=school-1')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(403);
    });
  });

  describe('POST /api/chat/rooms/:roomId/messages', () => {
    beforeEach(async () => {
      const room = await prisma.chatRoom.create({
        data: { schoolId: 'school-1', name: 'Test Room', type: 'class', createdBy: teacher.id },
      });
      roomId = room.id;
      await prisma.chatMember.createMany({
        data: [{ roomId, userId: teacher.id }, { roomId, userId: student.id }],
      });
    });

    it('sends a message (member)', async () => {
      const res = await request(app)
        .post(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ text: 'Hello, class!' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.text).toBe('Hello, class!');
      expect(res.body.authorId).toBe(student.id);
    });

    it('rejects message from non-member', async () => {
      await request(app)
        .post(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ text: 'Hi' })
        .expect(403);
    });

    it('validates message text', async () => {
      await request(app)
        .post(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ text: '' })
        .expect(400);
    });

    it('rejects message longer than 2000 chars', async () => {
      await request(app)
        .post(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ text: 'x'.repeat(2001) })
        .expect(400);
    });
  });

  describe('GET /api/chat/rooms/:roomId/messages', () => {
    beforeEach(async () => {
      const room = await prisma.chatRoom.create({
        data: { schoolId: 'school-1', name: 'Test Room', type: 'class', createdBy: teacher.id },
      });
      roomId = room.id;
      await prisma.chatMember.createMany({
        data: [{ roomId, userId: teacher.id }, { roomId, userId: student.id }],
      });
      await prisma.chatMessage.createMany({
        data: [
          { roomId, authorId: teacher.id, text: 'Welcome!' },
          { roomId, authorId: student.id, text: 'Thank you!' },
        ],
      });
    });

    it('retrieves messages (member)', async () => {
      const res = await request(app)
        .get(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((m) => m.text)).toContain('Welcome!');
      expect(res.body.map((m) => m.text)).toContain('Thank you!');
    });

    it('rejects non-member', async () => {
      await request(app)
        .get(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(403);
    });

    it('rejects a non-member parent', async () => {
      await request(app)
        .get(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
    });

    it("rejects a teacher of another school", async () => {
      await request(app)
        .get(`/api/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(403);
    });

    it('respects limit parameter', async () => {
      const res = await request(app)
        .get(`/api/chat/rooms/${roomId}/messages?limit=1`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/chat/rooms/:roomId/members', () => {
    beforeEach(async () => {
      const room = await prisma.chatRoom.create({
        data: { schoolId: 'school-1', name: 'Test Room', type: 'class', createdBy: teacher.id },
      });
      roomId = room.id;
      await prisma.chatMember.create({ data: { roomId, userId: teacher.id } });
    });

    it('adds member (teacher)', async () => {
      await request(app)
        .post(`/api/chat/rooms/${roomId}/members`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ userId: student.id })
        .expect(201);

      const members = await prisma.chatMember.findMany({ where: { roomId } });
      expect(members).toHaveLength(2);
    });

    it('rejects duplicate member', async () => {
      await prisma.chatMember.create({ data: { roomId, userId: student.id } });
      await request(app)
        .post(`/api/chat/rooms/${roomId}/members`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ userId: student.id })
        .expect(400);
    });

    it('rejects student adding members', async () => {
      await request(app)
        .post(`/api/chat/rooms/${roomId}/members`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ userId: student2.id })
        .expect(403);
    });
  });

  describe('DELETE /api/chat/rooms/:roomId/members/:userId', () => {
    beforeEach(async () => {
      const room = await prisma.chatRoom.create({
        data: { schoolId: 'school-1', name: 'Test Room', type: 'class', createdBy: teacher.id },
      });
      roomId = room.id;
      await prisma.chatMember.createMany({
        data: [{ roomId, userId: teacher.id }, { roomId, userId: student.id }],
      });
    });

    it('removes member (teacher)', async () => {
      await request(app)
        .delete(`/api/chat/rooms/${roomId}/members/${student.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const members = await prisma.chatMember.findMany({ where: { roomId } });
      expect(members).toHaveLength(1);
    });

    it('allows self-removal', async () => {
      await request(app)
        .delete(`/api/chat/rooms/${roomId}/members/${student.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });

    it('rejects student removing someone else', async () => {
      await request(app)
        .delete(`/api/chat/rooms/${roomId}/members/${teacher.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
