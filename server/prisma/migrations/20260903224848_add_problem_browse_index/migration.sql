-- CreateIndex
CREATE INDEX "problems_isPublished_createdAt_idx" ON "problems"("isPublished", "createdAt" DESC);
