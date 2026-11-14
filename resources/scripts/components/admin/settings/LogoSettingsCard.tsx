import { useRef, useState } from 'react';
import { Button, TitledGreyBox } from '@/sdk';
import { useDeleteAdminLogo, useUploadAdminLogo } from '@/api/admin/settings/queries';
import type { AdminSettings } from '@/api/admin/settings/queries';
import { imageUploadAccept } from '@/lib/images';
import { useObjectUrl } from '@/plugins/useObjectUrl';

export default function LogoSettingsCard({ settings }: { settings: AdminSettings }) {
    const readOnly = settings.meta.load_environment_only;
    const input = useRef<HTMLInputElement>(null);
    const upload = useUploadAdminLogo();
    const remove = useDeleteAdminLogo();
    const logo = settings.general['app:logo'];
    const [selected, setSelected] = useState<File | null>(null);
    const picked = useObjectUrl(selected);
    const preview = selected ? picked : logo;
    const save = () => {
        if (selected) {
            upload.mutate({ body: { logo: selected } }, { onSuccess: () => setSelected(null) });
        }
    };

    return (
        <TitledGreyBox title='Logo 图片' className='mt-6'>
            <div className='flex flex-col gap-4'>
                <div className='flex items-start gap-4'>
                    <div className='flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border border-border bg-background p-2'>
                        {preview ? (
                            <img src={preview} alt='面板 Logo' className='h-full w-full object-contain' />
                        ) : (
                            <img src='/favicons/favicon.svg' alt='默认 Logo' className='h-full w-full object-contain' />
                        )}
                    </div>
                    <p className='m-0 text-sm text-muted-foreground'>
                        此 Logo 会作为网站图标，同时显示在登录页，并在导航栏中替代公司名称。若主题自带
                        Logo，则显示主题的 Logo。支持 PNG、JPEG、SVG、WebP、AVIF 和 ICO 格式。
                    </p>
                </div>
                <input
                    ref={input}
                    type='file'
                    aria-label='Logo 图片文件'
                    accept={imageUploadAccept}
                    className='hidden'
                    onChange={(event) => setSelected(event.target.files?.[0] ?? null)}
                />
                <div className='flex justify-end gap-2'>
                    <Button
                        type='button'
                        disabled={readOnly}
                        isLoading={upload.isPending}
                        onClick={() => (selected ? save() : input.current?.click())}
                    >
                        {selected ? '保存 Logo' : '上传 Logo'}
                    </Button>
                    <Button.Danger
                        type='button'
                        disabled={readOnly || !logo || !!selected}
                        isLoading={remove.isPending}
                        onClick={() => remove.mutate({})}
                    >
                        移除 Logo
                    </Button.Danger>
                </div>
            </div>
        </TitledGreyBox>
    );
}
