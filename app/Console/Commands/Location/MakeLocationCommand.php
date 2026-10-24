<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Location;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Contracts\Locations\CreatesLocations;

#[Description('通过命令行在系统中创建新地域。')]
#[Signature('p:location:make
                            {--short= : 该地域的短代码名称（例如 us1）。}
                            {--long= : 该地域的详细描述。}')]
class MakeLocationCommand extends Command
{
    /**
     * Handle the command execution process.
     */
    public function handle(CreatesLocations $locations): int
    {
        $input = [
            'short' => $this->option('short') ?? $this->ask(trans('command/messages.location.ask_short')),
            'long' => $this->option('long') ?? $this->ask(trans('command/messages.location.ask_long')),
        ];

        try {
            $location = $locations->create($input);
        } catch (ValidationException $validationException) {
            foreach ($validationException->validator->errors()->all() as $error) {
                $this->error($error);
            }

            return 1;
        }

        $this->line(trans('command/messages.location.created', [
            'name' => $location->short,
            'id' => $location->id,
        ]));

        return 0;
    }
}
