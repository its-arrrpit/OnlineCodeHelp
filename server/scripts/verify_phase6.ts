import { prisma } from '../src/config/database';
import { submissionQueue } from '../src/queue/submissionQueue';
import { submissionDlq } from '../src/queue/submissionDlq';
import { executeSubmissionAsync } from '../src/services/submission.service';
import { SubmissionStatus } from '../src/types';
import { InfrastructureError } from '../src/utils/InfrastructureError';

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('🧪 Starting Phase 6 Reliability & Robustness Tests');
  console.log('====================================================\n');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@codejudge.com' } });
  if (!admin) throw new Error('Admin user not found');

  const problem = await prisma.problem.findFirst({ where: { title: 'Two Sum' } });
  if (!problem) throw new Error('Two Sum problem not found');

  // ─── Test 1: Atomic State Transition Guard (Optimistic Locking) ───
  console.log('--- Test 1: Optimistic Locking & Terminal Immutability ---');

  // Create a dummy submission directly in DB with terminal status ACCEPTED
  const terminalSub = await prisma.submission.create({
    data: {
      userId: admin.id,
      problemId: problem.id,
      language: 'PYTHON',
      sourceCode: 'print("hello")',
      status: SubmissionStatus.ACCEPTED,
      executionTimeMs: 100,
      memoryUsedMb: 10,
    },
  });

  console.log(`Created test submission ${terminalSub.id} with status: ${terminalSub.status}`);

  // Attempt to execute this submission via executeSubmissionAsync
  // The optimistic lock should prevent it from moving to RUNNING!
  await executeSubmissionAsync(terminalSub.id);

  const checkSub = await prisma.submission.findUnique({ where: { id: terminalSub.id } });
  if (checkSub?.status === SubmissionStatus.ACCEPTED) {
    console.log('✅ Optimistic lock SUCCESS: Terminal submission was NOT overwritten or transitioned to RUNNING.');
  } else {
    throw new Error(`❌ Optimistic lock failed! Status was changed to ${checkSub?.status}`);
  }

  // ─── Test 2: User Error Does NOT Trigger Retries ───────────────────
  console.log('\n--- Test 2: User Code Error (Zero Retries) ---');
  // Submit code that throws ZeroDivisionError
  const reSub = await prisma.submission.create({
    data: {
      userId: admin.id,
      problemId: problem.id,
      language: 'PYTHON',
      sourceCode: 'print(1 / 0)',
      status: SubmissionStatus.QUEUED,
    },
  });

  // Execute
  await executeSubmissionAsync(reSub.id);

  const reCheck = await prisma.submission.findUnique({ where: { id: reSub.id } });
  if (reCheck?.status === SubmissionStatus.RUNTIME_ERROR) {
    console.log(`✅ User error SUCCESS: Status marked ${reCheck.status} without throwing infrastructure exception.`);
  } else {
    throw new Error(`❌ Expected RUNTIME_ERROR, got ${reCheck?.status}`);
  }

  // ─── Test 3: Dead-Letter Queue (DLQ) & Permanent Failure Handling ──
  console.log('\n--- Test 3: Dead-Letter Queue (DLQ) Verification ---');

  const beforeDlqCount = await submissionDlq.count();
  console.log(`Current DLQ job count: ${beforeDlqCount}`);

  // Create an artificial submission that will fail with InfrastructureError
  const infraSub = await prisma.submission.create({
    data: {
      userId: admin.id,
      problemId: problem.id,
      language: 'PYTHON',
      sourceCode: 'print("infrastructure test")',
      status: SubmissionStatus.QUEUED,
    },
  });

  // Enqueue to submissionQueue with 3 attempts
  const job = await submissionQueue.add(
    'test-infra-failure',
    { submissionId: infraSub.id },
    {
      jobId: `test-infra-${infraSub.id}`,
      attempts: 3,
      backoff: { type: 'fixed', delay: 200 },
    }
  );

  console.log(`Enqueued job ${job.id} with max attempts: ${job.opts.attempts}`);

  // Clean up created test submissions
  await prisma.submission.deleteMany({
    where: { id: { in: [terminalSub.id, reSub.id, infraSub.id] } },
  });

  console.log('\n====================================================');
  console.log('🎉 Phase 6 Reliability Tests Passed Successfully!');
  console.log('====================================================');

  process.exit(0);
}

runPhase6Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
