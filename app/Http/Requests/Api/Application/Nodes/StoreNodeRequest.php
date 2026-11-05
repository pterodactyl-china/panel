<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Requests\Api\Application\Nodes;

use Illuminate\Database\Eloquent\Model;
use Pterodactyl\Actions\Nodes\CreateNode;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;
use Pterodactyl\Http\Requests\Concerns\ValidatesExtensionFields;
use Pterodactyl\Models\Node;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class StoreNodeRequest extends ApplicationApiRequest
{
    use ValidatesExtensionFields;

    protected ?string $resource = AdminAcl::RESOURCE_NODES;

    protected int $permission = AdminAcl::WRITE;

    /**
     * Validation rules to apply to this request.
     *
     * @return ValidationRules
     */
    public function rules(): array
    {
        return CreateNode::rules();
    }

    /**
     * Fields to rename for clarity in the API response.
     */
    public function attributes(): array
    {
        return [
            'daemon_base' => '守护进程基础路径',
            'upload_size' => '文件上传大小上限',
            'location_id' => '地域',
            'public' => '节点可见性',
        ];
    }

    /**
     * {@inheritdoc}
     */
    protected function extensionFieldsModel(): Model|string
    {
        return Node::class;
    }
}
