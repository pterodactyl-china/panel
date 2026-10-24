import { useState } from 'react';
import { HardDrive } from 'lucide-react';
import {
    attachAdminMountNodesInput,
    type AdminMountWithRelations,
    useAttachAdminMountNodes,
} from '@/api/admin/mounts/queries';
import { useAdminNodesGroupedByLocation } from '@/api/admin/nodes/queries';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Button from '@/components/elements/Button';
import Select from '@/components/ui/Select';
import Label from '@/components/elements/Label';
import Spinner from '@/components/elements/Spinner';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { relationshipData } from '@/api/relationships';
import { cn } from '@/lib/cn';

interface Props {
    mount: AdminMountWithRelations;
    open: boolean;
    onClose: () => void;
    onAttached: () => void;
}

export default function AttachNodesModal({ mount, open, onClose, onAttached }: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const attachNodes = useAttachAdminMountNodes();
    const submitting = attachNodes.isPending;

    const { data: locations } = useAdminNodesGroupedByLocation({ enabled: open });

    const attachedIds = new Set(
        relationshipData(mount.attributes.relationships?.nodes).map((node) => node.attributes.id)
    );

    type LocationWithAvailableNodes = {
        location: NonNullable<typeof locations>[number]['location'];
        nodes: NonNullable<typeof locations>[number]['nodes'];
    };

    const groups = (locations ?? []).reduce<LocationWithAvailableNodes[]>((groups, group) => {
        const nodes = group.nodes.filter((node) => !attachedIds.has(node.id));

        if (nodes.length > 0) {
            groups.push({ location: group.location, nodes });
        }

        return groups;
    }, []);

    const hasNodes = (locations ?? []).some((group) => group.nodes.length > 0);

    const submit = () => {
        if (selected.length === 0) {
            return;
        }

        attachNodes
            .mutateAsync(attachAdminMountNodesInput(mount.attributes.id, selected))
            .then(() => {
                setSelected([]);
                onAttached();
            })
            .catch(() => {
                // Error toast is handled by the mutation.
            });
    };

    return (
        <Dialog
            open={open}
            title='关联节点'
            preventExternalClose={submitting}
            hideCloseIcon={submitting}
            onClose={onClose}
        >
            <SpinnerOverlay visible={submitting} />
            {locations === undefined ? (
                <Spinner size='large' centered />
            ) : (
                <>
                    {groups.length === 0 ? (
                        <Empty size='compact'>
                            <EmptyHeader>
                                <EmptyMedia variant='icon'>
                                    <HardDrive />
                                </EmptyMedia>
                                <EmptyTitle>{hasNodes ? '所有节点均已关联' : '暂无节点'}</EmptyTitle>
                                <EmptyDescription>
                                    {hasNodes ? '所有节点都已关联到此挂载。' : '请先创建节点，再将其关联到此挂载。'}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <>
                            <Label>节点</Label>
                            <Select
                                multiple
                                placeholder='选择一个或多个节点…'
                                value={selected}
                                onChange={(value) => setSelected((value as (string | number)[]).map(Number))}
                                groups={groups.map((group) => ({
                                    label: `${group.location.attributes.long || group.location.attributes.short} (${group.location.attributes.short})`,
                                    options: group.nodes.map((node) => ({ value: node.id, label: node.name })),
                                }))}
                            />
                        </>
                    )}
                    <div className='flex flex-wrap justify-end mt-6'>
                        <Button
                            type='button'
                            isSecondary
                            className={cn('w-full sm:w-auto', groups.length > 0 && 'sm:mr-2')}
                            onClick={onClose}
                        >
                            {groups.length > 0 ? '取消' : '关闭'}
                        </Button>
                        {groups.length > 0 && (
                            <Button
                                className='w-full mt-4 sm:w-auto sm:mt-0'
                                type='button'
                                disabled={selected.length === 0}
                                onClick={submit}
                            >
                                关联节点
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Dialog>
    );
}
