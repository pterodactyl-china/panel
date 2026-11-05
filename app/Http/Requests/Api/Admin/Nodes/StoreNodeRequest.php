<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Requests\Api\Admin\Nodes;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Validator;
use Pterodactyl\Actions\Nodes\CreateNode;
use Pterodactyl\Enum\Permissions;
use Pterodactyl\Http\Requests\Api\Admin\AdminApiRequest;
use Pterodactyl\Http\Requests\Concerns\ValidatesExtensionFields;
use Pterodactyl\Models\Node;
use Pterodactyl\Rules\Fqdn;

class StoreNodeRequest extends AdminApiRequest
{
    use ValidatesExtensionFields;

    public function permissions(): array
    {
        return [Permissions::AdminNodesCreate];
    }

    /**
     * Validation rules for creating a node: the node's own, with an FQDN that resolves and is
     * not an IP address when the node uses HTTPS.
     *
     * @return ValidationRules
     */
    public function rules(): array
    {
        $rules = CreateNode::rules();
        $rules['fqdn'][] = Fqdn::make('scheme');

        return $rules;
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->isSecure() && $this->input('scheme') === 'http') {
                $validator->errors()->add(
                    'scheme',
                    '面板通过 HTTPS 加载时不能使用 HTTP 节点连接。'
                );
            }
        }];
    }

    /** Rename fields to be more clear in error messages. */
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
