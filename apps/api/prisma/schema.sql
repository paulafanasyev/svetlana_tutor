CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'STUDENT' NOT NULL,
  blocked BOOLEAN DEFAULT false NOT NULL,
  level TEXT DEFAULT 'A1' NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  coins INTEGER DEFAULT 0 NOT NULL,
  "teacherId" TEXT,
  "schoolId" TEXT,
  locale TEXT DEFAULT 'ru' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "User_teacherId_idx" ON "User"("teacherId");

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  revoked BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

CREATE TABLE IF NOT EXISTS "Attempt" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "taskType" TEXT NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Attempt_userId_idx" ON "Attempt"("userId");
CREATE INDEX IF NOT EXISTS "Attempt_userId_createdAt_idx" ON "Attempt"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Attempt_taskType_idx" ON "Attempt"("taskType");
CREATE INDEX IF NOT EXISTS "Attempt_topic_idx" ON "Attempt"(topic);

CREATE TABLE IF NOT EXISTS "Unlock" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Unlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Unlock_userId_itemType_itemId_key" ON "Unlock"("userId", "itemType", "itemId");

CREATE TABLE IF NOT EXISTS "Material" (
  id TEXT PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  text TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Material_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Material_ownerId_idx" ON "Material"("ownerId");

CREATE TABLE IF NOT EXISTS "Setting" (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "AdminLog" (
  id TEXT PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "AdminLog_actorId_idx" ON "AdminLog"("actorId");
CREATE INDEX IF NOT EXISTS "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

CREATE TABLE IF NOT EXISTS "Class" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Class_teacherId_idx" ON "Class"("teacherId");

CREATE TABLE IF NOT EXISTS "Enrollment" (
  id TEXT PRIMARY KEY,
  "classId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"(id) ON DELETE CASCADE,
  CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_classId_studentId_key" ON "Enrollment"("classId", "studentId");
CREATE INDEX IF NOT EXISTS "Enrollment_studentId_idx" ON "Enrollment"("studentId");

CREATE TABLE IF NOT EXISTS "ParentLink" (
  id TEXT PRIMARY KEY,
  "parentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "ParentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "ParentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ParentLink_parentId_studentId_key" ON "ParentLink"("parentId", "studentId");
CREATE INDEX IF NOT EXISTS "ParentLink_studentId_idx" ON "ParentLink"("studentId");

CREATE TABLE IF NOT EXISTS "JournalEntry" (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "classId" TEXT,
  "teacherId" TEXT NOT NULL,
  kind TEXT NOT NULL,
  topic TEXT DEFAULT '' NOT NULL,
  mark INTEGER,
  comment TEXT DEFAULT '' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "JournalEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "JournalEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "JournalEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "JournalEntry_studentId_idx" ON "JournalEntry"("studentId");
CREATE INDEX IF NOT EXISTS "JournalEntry_classId_idx" ON "JournalEntry"("classId");
CREATE INDEX IF NOT EXISTS "JournalEntry_teacherId_idx" ON "JournalEntry"("teacherId");
CREATE INDEX IF NOT EXISTS "JournalEntry_studentId_createdAt_idx" ON "JournalEntry"("studentId", "createdAt");

CREATE TABLE IF NOT EXISTS "ChatRoom" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "ChatRoom_schoolId_idx" ON "ChatRoom"("schoolId");
CREATE INDEX IF NOT EXISTS "ChatRoom_type_idx" ON "ChatRoom"(type);

CREATE TABLE IF NOT EXISTS "ChatMember" (
  id TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "ChatMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"(id) ON DELETE CASCADE,
  CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ChatMember_roomId_userId_key" ON "ChatMember"("roomId", "userId");
CREATE INDEX IF NOT EXISTS "ChatMember_userId_idx" ON "ChatMember"("userId");

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  id TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  text TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"(id) ON DELETE CASCADE,
  CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_idx" ON "ChatMessage"("roomId");
CREATE INDEX IF NOT EXISTS "ChatMessage_authorId_idx" ON "ChatMessage"("authorId");
CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");
