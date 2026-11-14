import { useRef, useState } from 'react';
import Avatar from '@/components/Avatar';
import { Button, TitledGreyBox } from '@/sdk';
import { useDeleteAdminUserAvatar, useUpdateAdminUserAvatar } from '@/api/admin/users/queries';
import type { AdminUser } from '@/api/admin/users/queries';
import { imageUploadAccept } from '@/lib/images';
import { useObjectUrl } from '@/plugins/useObjectUrl';

export default function UserAvatarCard({ user }: { user: AdminUser }) {
    const input = useRef<HTMLInputElement>(null);
    const update = useUpdateAdminUserAvatar();
    const remove = useDeleteAdminUserAvatar();
    const image = user.attributes.avatar;
    const [selected, setSelected] = useState<File | null>(null);
    const picked = useObjectUrl(selected);
    const preview = selected ? picked : image;
    const save = () => {
        if (selected) {
            update.mutate(
                { path: { user_id: user.attributes.id }, body: { avatar: selected } },
                { onSuccess: () => setSelected(null) }
            );
        }
    };

    return (
        <TitledGreyBox title='头像'>
            <div className='flex flex-col gap-4'>
                <div className='flex items-start gap-4'>
                    <div className='h-[72px] w-[72px] shrink-0'>
                        <Avatar name={user.attributes.uuid} image={preview} size='100%' />
                    </div>
                    <p className='m-0 text-sm text-muted-foreground'>
                        将显示在用户个人账户中的头像。支持 PNG、JPEG、SVG、WebP、AVIF 与 ICO 格式。
                    </p>
                </div>
                <input
                    ref={input}
                    type='file'
                    accept={imageUploadAccept}
                    className='hidden'
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        setSelected(file ?? null);
                    }}
                />
                <div className='flex justify-end gap-2'>
                    <Button
                        type='button'
                        isLoading={update.isPending}
                        onClick={() => (selected ? save() : input.current?.click())}
                    >
                        {selected ? '保存更改' : '更新头像'}
                    </Button>
                    <Button.Danger
                        type='button'
                        disabled={!image || !!selected}
                        isLoading={remove.isPending}
                        onClick={() => remove.mutate({ path: { user_id: user.attributes.id } })}
                    >
                        移除头像
                    </Button.Danger>
                </div>
            </div>
        </TitledGreyBox>
    );
}
