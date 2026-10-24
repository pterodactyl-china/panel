import { Button, ContentBox, CopyOnClick, Dialog, Form, SpinnerOverlay } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { TextAreaField, TextField } from '../shared/fields';

function CreatedKeyDialog({ apiKey, onClose }: { apiKey: string | null; onClose: () => void }) {
    return (
        <Dialog open={apiKey !== null} onClose={onClose} preventExternalClose title='您的 API 密钥'>
            <p className='text-sm mb-6'>您请求的 API 密钥显示在下方。请将其保存在安全的位置，它不会再次显示。</p>
            <pre className='overflow-x-scroll text-sm bg-muted rounded-sm py-2 px-4 font-mono'>
                <CopyOnClick text={apiKey ?? ''}>
                    <code className='font-mono'>{apiKey}</code>
                </CopyOnClick>
            </pre>
            <div className='flex justify-end mt-6'>
                <Button type='button' onClick={onClose}>
                    关闭
                </Button>
            </div>
        </Dialog>
    );
}

export default function ApiKeyCreate({ model, className }: ViewProps<'account.apiKeys.create'>) {
    return (
        <ContentBox title='创建 API 密钥' className={className}>
            <CreatedKeyDialog apiKey={model.createdKey} onClose={model.dismissCreatedKey} />
            <Form form={{ handleSubmit: model.submit }}>
                <SpinnerOverlay visible={model.submitting} />
                <div className='mb-6'>
                    <TextField field={model.fields.description} label='描述' description='此 API 密钥的描述。' />
                </div>
                <TextAreaField
                    field={model.fields.allowedIps}
                    label='允许的 IP'
                    rows={6}
                    description='留空则允许任何 IP 地址使用此 API 密钥，否则请每行填写一个 IP 地址。'
                />
                <div className='flex justify-end mt-6'>
                    <Button type='submit' disabled={!model.canSubmit} isLoading={model.submitting}>
                        创建
                    </Button>
                </div>
            </Form>
        </ContentBox>
    );
}
