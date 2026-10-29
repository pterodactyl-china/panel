<?php

declare(strict_types=1);

namespace Pterodactyl\Actions\Tags;

use Pterodactyl\Contracts\Tags\DeletesTags;
use Pterodactyl\Enum\EggSpecificTags;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\Tag;

final readonly class DeleteTag implements DeletesTags
{
    public function delete(Tag $tag): void
    {
        // The cascading pivot cleanup would discard every egg and node assignment of a built-in
        // tag, and recreating the tag later cannot restore them.
        throw_if(EggSpecificTags::isSpecial($tag->slug), DisplayException::class, '内置游戏标签无法删除。');

        $tag->delete();
    }
}
