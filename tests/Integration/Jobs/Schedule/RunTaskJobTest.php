<?php

namespace Pterodactyl\Tests\Integration\Jobs\Schedule;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use GuzzleHttp\Psr7\Request;
use Pterodactyl\Models\Task;
use GuzzleHttp\Psr7\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Schedule;
use Illuminate\Support\Facades\Bus;
use Pterodactyl\Jobs\Schedule\RunTaskJob;
use GuzzleHttp\Exception\BadResponseException;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\Repositories\Wings\DaemonCommandRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class RunTaskJobTest extends IntegrationTestCase
{
    /**
     * An inactive job should not be run by the system.
     */
    public function testInactiveJobIsNotRun()
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_processing' => true,
            'last_run_at' => null,
            'is_active' => false,
        ]);
        /** @var Task $task */
        $task = Task::factory()->create(['schedule_id' => $schedule->id, 'is_queued' => true]);

        $job = new RunTaskJob($task);

        Bus::dispatchSync($job);

        $task->refresh();
        $schedule->refresh();

        $this->assertFalse($task->is_queued);
        $this->assertFalse($schedule->is_processing);
        $this->assertFalse($schedule->is_active);
        $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
    }

    public function testJobWithInvalidActionThrowsException()
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);
        /** @var Task $task */
        $task = Task::factory()->create(['schedule_id' => $schedule->id, 'action' => 'foobar']);

        $job = new RunTaskJob($task);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('提供的任务操作无效: foobar');
        Bus::dispatchSync($job);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('isManualRunDataProvider')]
    public function testJobIsExecuted(bool $isManualRun)
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => !$isManualRun,
            'is_processing' => true,
            'last_run_at' => null,
        ]);
        /** @var Task $task */
        $task = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
            'is_queued' => true,
            'continue_on_failure' => false,
        ]);

        $mock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $mock);

        $mock->expects('setServer')->with(\Mockery::on(function ($value) use ($server) {
            return $value instanceof Server && $value->id === $server->id;
        }))->andReturnSelf();
        $mock->expects('send')->with('start')->andReturn(new Response());

        Bus::dispatchSync(new RunTaskJob($task, $isManualRun));

        $task->refresh();
        $schedule->refresh();

        $this->assertFalse($task->is_queued);
        $this->assertFalse($schedule->is_processing);
        $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('isManualRunDataProvider')]
    public function testExceptionDuringRunIsHandledCorrectly(bool $continueOnFailure)
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);
        /** @var Task $task */
        $task = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
            'continue_on_failure' => $continueOnFailure,
        ]);

        $mock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $mock);

        $mock->expects('setServer->send')->andThrow(
            new DaemonConnectionException(new BadResponseException('Bad request', new Request('GET', '/test'), new Response()))
        );

        if (!$continueOnFailure) {
            $this->expectException(DaemonConnectionException::class);
        }

        Bus::dispatchSync(new RunTaskJob($task));

        if ($continueOnFailure) {
            $task->refresh();
            $schedule->refresh();

            $this->assertFalse($task->is_queued);
            $this->assertFalse($schedule->is_processing);
            $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
        }
    }

    /**
     * Test that a schedule is not executed if the server is suspended.
     *
     * @see https://github.com/pterodactyl/panel/issues/4008
     */
    public function testTaskIsNotRunIfServerIsSuspended()
    {
        $server = $this->createServerModel([
            'status' => Server::STATUS_SUSPENDED,
        ]);

        $schedule = Schedule::factory()->for($server)->create([
            'last_run_at' => Carbon::now()->subHour(),
        ]);

        $task = Task::factory()->for($schedule)->create([
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
        ]);

        Bus::dispatchSync(new RunTaskJob($task));

        $task->refresh();
        $schedule->refresh();

        $this->assertFalse($task->is_queued);
        $this->assertFalse($schedule->is_processing);
        $this->assertTrue(Carbon::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
    }

    /**
     * Test that a next task with a time offset is correctly dispatched with the expected delay
     * and the schedule remains in the processing state until all tasks complete.
     */
    public function testNextTaskWithTimeOffsetIsDispatchedCorrectly()
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => true,
            'is_processing' => true,
            'last_run_at' => null,
        ]);

        /** @var Task $task1 */
        $task1 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 1,
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
            'time_offset' => 0,
            'is_queued' => true,
            'continue_on_failure' => false,
        ]);

        /** @var Task $task2 */
        $task2 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 2,
            'action' => Task::ACTION_COMMAND,
            'payload' => 'say hello',
            'time_offset' => 30,
            'is_queued' => false,
            'continue_on_failure' => false,
        ]);

        $mock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $mock);
        $mock->expects('setServer')->andReturnSelf();
        $mock->expects('send')->with('start')->andReturn(new Response());

        Bus::fake();

        // Call handle() directly to bypass the faked bus so that the job actually
        // runs while the inner dispatch() call for the next task is still captured.
        $job = new RunTaskJob($task1);
        app()->call([$job, 'handle']);

        $task1->refresh();
        $task2->refresh();
        $schedule->refresh();

        // task1 should no longer be queued after running.
        $this->assertFalse($task1->is_queued);

        // task2 should have been marked as queued.
        $this->assertTrue($task2->is_queued);

        // The schedule should still be processing since task2 hasn't run yet.
        $this->assertTrue($schedule->is_processing);

        // task2 should have been dispatched with a 30-second delay.
        Bus::assertDispatched(RunTaskJob::class, function (RunTaskJob $job) use ($task2) {
            return $job->task->id === $task2->id && $job->delay === 30;
        });
    }

    /**
     * Test that multiple tasks with time offsets are correctly chained:
     * task1 → task2 (offset 30s) → task3 (offset 60s) → schedule complete.
     * This verifies queueNextTask() works for any number of chained offsets.
     */
    public function testMultipleTasksWithTimeOffsetsAreChainedCorrectly()
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => true,
            'is_processing' => true,
            'last_run_at' => null,
        ]);

        /** @var Task $task1 */
        $task1 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 1,
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
            'time_offset' => 0,
            'is_queued' => true,
            'continue_on_failure' => false,
        ]);

        /** @var Task $task2 */
        $task2 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 2,
            'action' => Task::ACTION_COMMAND,
            'payload' => 'say hello',
            'time_offset' => 30,
            'is_queued' => false,
            'continue_on_failure' => false,
        ]);

        /** @var Task $task3 */
        $task3 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 3,
            'action' => Task::ACTION_COMMAND,
            'payload' => 'say world',
            'time_offset' => 60,
            'is_queued' => false,
            'continue_on_failure' => false,
        ]);

        // --- Phase 1: task1 runs, dispatches task2 with 30s delay ---
        $powerMock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $powerMock);
        $powerMock->expects('setServer')->andReturnSelf();
        $powerMock->expects('send')->with('start')->andReturn(new Response());

        Bus::fake();
        app()->call([new RunTaskJob($task1), 'handle']);

        $task1->refresh();
        $task2->refresh();
        $schedule->refresh();

        $this->assertFalse($task1->is_queued);
        $this->assertTrue($task2->is_queued);
        $this->assertTrue($schedule->is_processing);
        Bus::assertDispatched(RunTaskJob::class, function (RunTaskJob $job) use ($task2) {
            return $job->task->id === $task2->id && $job->delay === 30;
        });

        // --- Phase 2: task2 runs, dispatches task3 with 60s delay ---
        $commandMock = \Mockery::mock(DaemonCommandRepository::class);
        $this->instance(DaemonCommandRepository::class, $commandMock);
        $commandMock->expects('setServer')->andReturnSelf();
        $commandMock->expects('send')->with('say hello')->andReturn(new Response());

        Bus::fake();
        app()->call([new RunTaskJob($task2), 'handle']);

        $task2->refresh();
        $task3->refresh();
        $schedule->refresh();

        $this->assertFalse($task2->is_queued);
        $this->assertTrue($task3->is_queued);
        $this->assertTrue($schedule->is_processing);
        Bus::assertDispatched(RunTaskJob::class, function (RunTaskJob $job) use ($task3) {
            return $job->task->id === $task3->id && $job->delay === 60;
        });

        // --- Phase 3: task3 runs, schedule completes ---
        $commandMock2 = \Mockery::mock(DaemonCommandRepository::class);
        $this->instance(DaemonCommandRepository::class, $commandMock2);
        $commandMock2->expects('setServer')->andReturnSelf();
        $commandMock2->expects('send')->with('say world')->andReturn(new Response());

        Bus::fake();
        app()->call([new RunTaskJob($task3), 'handle']);

        $task3->refresh();
        $schedule->refresh();

        $this->assertFalse($task3->is_queued);
        $this->assertFalse($schedule->is_processing);
        Bus::assertNotDispatched(RunTaskJob::class);
    }

    /**
     * Test the exact scenario reported by the user: three tasks where the second and third
     * tasks share the same time offset (0 → 1 → 1). This previously caused the schedule to
     * get stuck in "is_processing = true" because queueNextTask() used $this->dispatch()
     * (via the Dispatchable trait) which creates new RunTaskJob($jobInstance) — passing a
     * RunTaskJob where a Task is expected — instead of the global dispatch() helper which
     * correctly pushes the existing job instance onto the queue.
     */
    public function testTasksWithSameTimeOffsetAreChainedCorrectly()
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => true,
            'is_processing' => true,
            'last_run_at' => null,
        ]);

        /** @var Task $task1 */
        $task1 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 1,
            'action' => Task::ACTION_COMMAND,
            'payload' => 'say 1',
            'time_offset' => 0,
            'is_queued' => true,
            'continue_on_failure' => false,
        ]);

        /** @var Task $task2 */
        $task2 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 2,
            'action' => Task::ACTION_COMMAND,
            'payload' => 'say 2',
            'time_offset' => 1,
            'is_queued' => false,
            'continue_on_failure' => false,
        ]);

        /** @var Task $task3 */
        $task3 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 3,
            'action' => Task::ACTION_COMMAND,
            'payload' => 'say 3',
            'time_offset' => 1,
            'is_queued' => false,
            'continue_on_failure' => false,
        ]);

        // --- Phase 1: task1 runs (offset=0), dispatches task2 with 1s delay ---
        $commandMock1 = \Mockery::mock(DaemonCommandRepository::class);
        $this->instance(DaemonCommandRepository::class, $commandMock1);
        $commandMock1->expects('setServer')->andReturnSelf();
        $commandMock1->expects('send')->with('say 1')->andReturn(new Response());

        Bus::fake();
        app()->call([new RunTaskJob($task1), 'handle']);

        $task1->refresh();
        $task2->refresh();
        $schedule->refresh();

        $this->assertFalse($task1->is_queued);
        $this->assertTrue($task2->is_queued);
        $this->assertTrue($schedule->is_processing);
        Bus::assertDispatched(RunTaskJob::class, function (RunTaskJob $job) use ($task2) {
            return $job->task->id === $task2->id && $job->delay === 1;
        });

        // --- Phase 2: task2 runs (offset=1, same as task3), dispatches task3 with 1s delay ---
        $commandMock2 = \Mockery::mock(DaemonCommandRepository::class);
        $this->instance(DaemonCommandRepository::class, $commandMock2);
        $commandMock2->expects('setServer')->andReturnSelf();
        $commandMock2->expects('send')->with('say 2')->andReturn(new Response());

        Bus::fake();
        app()->call([new RunTaskJob($task2), 'handle']);

        $task2->refresh();
        $task3->refresh();
        $schedule->refresh();

        $this->assertFalse($task2->is_queued);
        $this->assertTrue($task3->is_queued);
        $this->assertTrue($schedule->is_processing);
        Bus::assertDispatched(RunTaskJob::class, function (RunTaskJob $job) use ($task3) {
            return $job->task->id === $task3->id && $job->delay === 1;
        });

        // --- Phase 3: task3 runs (offset=1, same as task2), schedule completes ---
        $commandMock3 = \Mockery::mock(DaemonCommandRepository::class);
        $this->instance(DaemonCommandRepository::class, $commandMock3);
        $commandMock3->expects('setServer')->andReturnSelf();
        $commandMock3->expects('send')->with('say 3')->andReturn(new Response());

        Bus::fake();
        app()->call([new RunTaskJob($task3), 'handle']);

        $task3->refresh();
        $schedule->refresh();

        $this->assertFalse($task3->is_queued);
        $this->assertFalse($schedule->is_processing);
        Bus::assertNotDispatched(RunTaskJob::class);
    }

    public static function isManualRunDataProvider(): array
    {
        return [[true], [false]];
    }
}
