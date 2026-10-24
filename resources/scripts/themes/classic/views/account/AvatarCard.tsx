import { useRef } from 'react';
import { Avatar, Button, ContentBox, SpinnerOverlay } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function AvatarCard({ model, className }: ViewProps<'account.avatar'>) {
    const input = useRef<HTMLInputElement>(null);

    return (
        <ContentBox className={className} title='更新头像'>
            <SpinnerOverlay size='large' visible={model.submitting} />
            <div className='flex flex-col gap-4'>
                <div className='flex items-start gap-4'>
                    <div className='h-[72px] w-[72px] shrink-0'>
                        <Avatar name={model.uuid} image={model.preview} />
                    </div>
                    <p className='m-0 text-sm'>
                        您可以为个人账户选择自定义头像。支持 PNG、JPEG、SVG、WebP、AVIF 与 ICO 格式。
                    </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                    <input
                        ref={input}
                        type='file'
                        accept={model.accept}
                        className='hidden'
                        aria-label='头像文件'
                        onChange={(event) => model.select(event.target.files?.[0] ?? null)}
                    />
                    <Button
                        type='button'
                        onClick={() => (model.selected ? model.submit() : input.current?.click())}
                        disabled={model.selected ? !model.canSubmit : false}
                    >
                        {model.selected ? '保存更改' : '更新头像'}
                    </Button>
                    <Button.Danger type='button' disabled={!model.avatar || !!model.selected} onClick={model.remove}>
                        移除头像
                    </Button.Danger>
                </div>
            </div>
        </ContentBox>
    );
}
