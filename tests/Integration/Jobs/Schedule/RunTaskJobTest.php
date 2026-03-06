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
     * Test that when a schedule has multiple tasks, completing one task queues
     * the next task rather than getting stuck in a processing state.
     */
    public function testNextTaskIsQueuedAfterCurrentTaskCompletes()
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
        ]);

        /** @var Task $task2 */
        $task2 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 2,
            'action' => Task::ACTION_POWER,
            'payload' => 'restart',
            'time_offset' => 1,
            'is_queued' => false,
        ]);

        $mock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $mock);

        $mock->shouldReceive('setServer')
            ->twice()
            ->with(\Mockery::on(function ($value) use ($server) {
                return $value instanceof Server && $value->id === $server->id;
            }))
            ->andReturnSelf();
        $mock->shouldReceive('send')->with('start')->once()->andReturn(new Response());
        $mock->shouldReceive('send')->with('restart')->once()->andReturn(new Response());

        // With QUEUE_DRIVER=sync, Bus::dispatch() inside queueNextTask() also runs task2 synchronously.
        Bus::dispatchSync(new RunTaskJob($task1));

        $task1->refresh();
        $task2->refresh();
        $schedule->refresh();

        // Both tasks should no longer be queued
        $this->assertFalse($task1->is_queued);
        $this->assertFalse($task2->is_queued);
        // Schedule should be complete (not stuck in processing)
        $this->assertFalse($schedule->is_processing);
        $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
    }

    /**
     * Test that a schedule with three tasks runs each task exactly once and completes correctly.
     * This is a regression test for the bug where the second task would run N times (for a
     * schedule with N tasks) and the last task would never run.
     */
    public function testThreeTaskScheduleRunsEachTaskExactlyOnce()
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
        ]);

        /** @var Task $task2 */
        $task2 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 2,
            'action' => Task::ACTION_POWER,
            'payload' => 'restart',
            'time_offset' => 0,
            'is_queued' => false,
        ]);

        /** @var Task $task3 */
        $task3 = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 3,
            'action' => Task::ACTION_POWER,
            'payload' => 'stop',
            'time_offset' => 0,
            'is_queued' => false,
        ]);

        $mock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $mock);

        $mock->shouldReceive('setServer')
            ->times(3)
            ->with(\Mockery::on(function ($value) use ($server) {
                return $value instanceof Server && $value->id === $server->id;
            }))
            ->andReturnSelf();
        // Each task's payload must be sent exactly once.
        $mock->shouldReceive('send')->with('start')->once()->andReturn(new Response());
        $mock->shouldReceive('send')->with('restart')->once()->andReturn(new Response());
        $mock->shouldReceive('send')->with('stop')->once()->andReturn(new Response());

        // With QUEUE_DRIVER=sync, all three tasks run synchronously in sequence.
        Bus::dispatchSync(new RunTaskJob($task1));

        $task1->refresh();
        $task2->refresh();
        $task3->refresh();
        $schedule->refresh();

        // All tasks should no longer be queued.
        $this->assertFalse($task1->is_queued);
        $this->assertFalse($task2->is_queued);
        $this->assertFalse($task3->is_queued);
        // Schedule should be complete after all tasks run.
        $this->assertFalse($schedule->is_processing);
        $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
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

    public static function isManualRunDataProvider(): array
    {
        return [[true], [false]];
    }
}
