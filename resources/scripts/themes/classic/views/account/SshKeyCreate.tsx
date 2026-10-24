import { Button, ContentBox, Form, SpinnerOverlay } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { TextAreaField, TextField } from '../shared/fields';

export default function SshKeyCreate({ model, className }: ViewProps<'account.sshKeys.create'>) {
    return (
        <ContentBox title='添加 SSH 密钥' className={className}>
            <Form form={{ handleSubmit: model.submit }}>
                <SpinnerOverlay visible={model.submitting} />
                <div className='mb-6'>
                    <TextField field={model.fields.name} label='SSH 密钥名称' />
                </div>
                <TextAreaField
                    field={model.fields.publicKey}
                    label='公钥'
                    rows={6}
                    description='请输入您的 SSH 公钥。'
                />
                <div className='flex justify-end mt-6'>
                    <Button type='submit' disabled={!model.canSubmit} isLoading={model.submitting}>
                        保存
                    </Button>
                </div>
            </Form>
        </ContentBox>
    );
}
