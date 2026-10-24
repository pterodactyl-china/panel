import { useNavigate } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { importAdminEggInput, useImportAdminEgg } from '@/api/admin/eggs/queries';
import EggFileDialog from '@/components/admin/eggs/EggFileDialog';
import { Dialog } from '@/components/elements/dialog';
import { NewButton } from '@/components/elements/NewButton';

export default function ImportEggButton() {
    const navigate = useNavigate();
    const importEgg = useImportAdminEgg();

    const submit = async (file: File) => {
        const egg = await importEgg.mutateAsync(importAdminEggInput({ import_file: file }));

        void navigate({ to: '/panel/eggs/$eggId', params: { eggId: egg.attributes.id } });
    };

    return (
        <Dialog.Trigger
            trigger={({ onClick }) => (
                <NewButton isSecondary icon={Upload} onClick={onClick}>
                    导入预设
                </NewButton>
            )}
        >
            {({ open, onClose }) => (
                <EggFileDialog
                    open={open}
                    onClose={onClose}
                    title='导入预设'
                    description='上传预设 JSON 文件以添加服务器模板。'
                    submitLabel='导入预设'
                    submitting={importEgg.isPending}
                    onSubmit={submit}
                />
            )}
        </Dialog.Trigger>
    );
}
