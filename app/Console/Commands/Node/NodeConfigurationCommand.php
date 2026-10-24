<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Node;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Models\Node;

#[Description('显示指定节点的配置。')]
#[Signature('p:node:configuration
                            {node : 要获取配置的节点 ID 或 UUID。}
                            {--format=yaml : 输出格式，可选「yaml」或「json」。}')]
class NodeConfigurationCommand extends Command
{
    public function handle(): int
    {
        $argument = $this->argument('node');
        $column = ctype_digit($argument) ? 'id' : 'uuid';

        $node = Node::query()->where($column, $argument)->first();
        if ($node === null) {
            $this->error('所选节点不存在。');

            return 1;
        }

        $format = $this->option('format');
        if (! in_array($format, ['yaml', 'yml', 'json'])) {
            $this->error('指定的格式无效，有效选项为「yaml」与「json」。');

            return 1;
        }

        if ($format === 'json') {
            $this->output->write($node->getJsonConfiguration(true));
        } else {
            $this->output->write($node->getYamlConfiguration());
        }

        $this->output->newLine();

        return 0;
    }
}
