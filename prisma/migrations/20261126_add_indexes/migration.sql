-- Performance indexes for common queries
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");
CREATE INDEX "Task_communityId_idx" ON "Task"("communityId");
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt" DESC);
CREATE INDEX "Submission_taskId_idx" ON "Submission"("taskId");
CREATE INDEX "Submission_contributorId_idx" ON "Submission"("contributorId");
CREATE INDEX "Submission_status_idx" ON "Submission"("status");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX "CommunityMember_communityId_idx" ON "CommunityMember"("communityId");
CREATE INDEX "User_reputation_idx" ON "User"("reputation" DESC);
