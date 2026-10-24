import { useState } from 'react';
import { Egg } from 'lucide-react';
import {
    attachAdminMountEggsInput,
    type AdminMountWithRelations,
    useAttachAdminMountEggs,
} from '@/api/admin/mounts/queries';
import { useAdminEggs } from '@/api/admin/eggs/queries';
import { Dialog } from '@/components/elements/dialog';
import Button from '@/components/elements/Button';
import Select from '@/components/ui/Select';
import Label from '@/components/elements/Label';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { relationshipData } from '@/api/relationships';
import { cn } from '@/lib/cn';

interface Props {
    mount: AdminMountWithRelations;
    open: boolean;
    onClose: () => void;
    onAttached: () => void;
}

export default function AttachEggsModal({ mount, open, onClose, onAttached }: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const attachEggs = useAttachAdminMountEggs();
    const submitting = attachEggs.isPending;

    const { data: eggs } = useAdminEggs();

    const attachedIds = new Set(relationshipData(mount.attributes.relationships?.eggs).map((egg) => egg.attributes.id));

    const availableEggs = (eggs?.data ?? []).filter((egg) => !attachedIds.has(egg.attributes.id));

    const submit = () => {
        if (selected.length === 0) {
            return;
        }

        attachEggs
            .mutateAsync(attachAdminMountEggsInput(mount.attributes.id, selected))
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
            title='关联预设'
            preventExternalClose={submitting}
            hideCloseIcon={submitting}
            onClose={onClose}
        >
            <SpinnerOverlay visible={submitting} />
            {eggs === undefined ? (
                <Spinner size='large' centered />
            ) : (
                <>
                    {availableEggs.length === 0 ? (
                        <Empty size='compact'>
                            <EmptyHeader>
                                <EmptyMedia variant='icon'>
                                    <Egg />
                                </EmptyMedia>
                                <EmptyTitle>{eggs.data.length === 0 ? '暂无预设' : '所有预设均已关联'}</EmptyTitle>
                                <EmptyDescription>
                                    {eggs.data.length === 0
                                        ? '请先创建或导入预设，再将其关联到此挂载。'
                                        : '所有预设都已关联到此挂载。'}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <>
                            <Label>预设</Label>
                            <Select
                                multiple
                                placeholder='选择一个或多个预设…'
                                value={selected}
                                onChange={(value) => setSelected((value as (string | number)[]).map(Number))}
                                options={availableEggs.map((egg) => ({
                                    value: egg.attributes.id,
                                    label: egg.attributes.name,
                                }))}
                            />
                        </>
                    )}
                    <div className='flex flex-wrap justify-end mt-6'>
                        <Button
                            type='button'
                            isSecondary
                            className={cn('w-full sm:w-auto', availableEggs.length > 0 && 'sm:mr-2')}
                            onClick={onClose}
                        >
                            {availableEggs.length > 0 ? '取消' : '关闭'}
                        </Button>
                        {availableEggs.length > 0 && (
                            <Button
                                className='w-full mt-4 sm:w-auto sm:mt-0'
                                type='button'
                                disabled={selected.length === 0}
                                onClick={submit}
                            >
                                关联预设
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Dialog>
    );
}
