import { useAdminNodesGroupedByLocation } from '@/api/admin/nodes/queries';
import Select from '@/components/ui/Select';
import Label from '@/components/elements/Label';

interface Props {
    id: string;
    value: string;
    onChange: (value: string) => void;
}

export default function DatabaseHostNodeSelect({ id, value, onChange }: Props) {
    const { data: locations } = useAdminNodesGroupedByLocation();

    const groups = [
        {
            label: '全局',
            options: [{ value: '', label: '无' }],
        },
        ...(locations ?? []).map((group) => ({
            label: `${group.location.attributes.long || group.location.attributes.short} (${group.location.attributes.short})`,
            options: group.nodes.map((node) => ({
                value: String(node.id),
                label: `${node.name} (${node.fqdn})`,
            })),
        })),
    ];

    return (
        <div>
            <Label htmlFor={id}>关联节点</Label>
            <Select
                id={id}
                value={value}
                placeholder='不关联'
                groups={groups}
                disabled={locations === undefined}
                onChange={(value) => onChange(String(value))}
            />
            <p className='input-help'>为所选节点上的服务器添加数据库时，默认使用此数据库主机。</p>
        </div>
    );
}
