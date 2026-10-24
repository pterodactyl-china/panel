import type { AdminEgg } from '@/api/admin/eggs/queries';
import { updateAdminEggFromFileInput, useUpdateAdminEggFromFile } from '@/api/admin/eggs/queries';
import EggFileDialog from '@/components/admin/eggs/EggFileDialog';
import { Dialog } from '@/components/elements/dialog';
import Button from '@/components/elements/Button';

interface Props {
    egg: AdminEgg;
}

export default function UpdateEggFromFileButton({ egg }: Props) {
    const updateEggFromFile = useUpdateAdminEggFromFile();

    const submit = async (file: File) => {
        await updateEggFromFile.mutateAsync(updateAdminEggFromFileInput(egg.attributes.id, { import_file: file }));
    };

    return (
        <Dialog.Trigger
            trigger={({ onClick }) => (
                <Button isSecondary onClick={onClick}>
                    从文件更新
                </Button>
            )}
        >
            {({ open, onClose }) => (
                <EggFileDialog
                    open={open}
                    onClose={onClose}
                    title='通过文件更新预设'
                    description='上传新的预设 JSON 文件以替换此预设的设置。不会更改已使用此预设的服务器的现有启动命令或 Docker 镜像。'
                    submitLabel='更新预设'
                    submitColor='red'
                    submitting={updateEggFromFile.isPending}
                    onSubmit={submit}
                />
            )}
        </Dialog.Trigger>
    );
}
