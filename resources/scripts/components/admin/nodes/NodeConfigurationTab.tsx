import { useState } from 'react';
import { Copy } from 'lucide-react';
import {
    type DeployToken,
    generateAdminNodeDeployTokenInput,
    useAdminNodeConfiguration,
    useGenerateAdminNodeDeployToken,
} from '@/api/admin/nodes/queries';
import { useNodeDetail } from '@/components/admin/nodes/useNodeDetail';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Button from '@/components/elements/Button';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Icon from '@/components/elements/Icon';
import { Alert } from '@/components/elements/alert';
import { httpErrorToHuman } from '@/api/http';
import { toYaml } from '@/components/admin/nodes/nodeConfigurationYaml';

type NodeConfigurationQuery = ReturnType<typeof useAdminNodeConfiguration>;

const ConfigurationFile = ({ query }: { query: NodeConfigurationQuery }) => {
    const { data: config, error, isFetching, refetch } = query;

    if (error && !isFetching) {
        return (
            <div className='space-y-4'>
                <Alert type='danger'>{httpErrorToHuman(error)}</Alert>
                <Button.Text type='button' onClick={() => refetch()}>
                    重试
                </Button.Text>
            </div>
        );
    }

    if (!config) {
        return <Spinner size='large' centered />;
    }

    const yaml = toYaml(config);

    return (
        <div className='overflow-hidden rounded-sm border border-border bg-sunken'>
            <div className='flex items-center justify-between border-b border-border py-1.5 pr-1.5 pl-4 text-xs text-muted-foreground'>
                <span className='font-mono'>config.yml</span>
                <CopyOnClick text={yaml} showInNotification={false}>
                    <Button.Text type='button' size='xsmall' isSecondary aria-label='复制配置文件'>
                        <Icon icon={Copy} className='h-3.5 w-3.5' />
                    </Button.Text>
                </CopyOnClick>
            </div>
            <pre className='overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-foreground'>{yaml}</pre>
        </div>
    );
};

export default function NodeConfigurationTab() {
    const { node } = useNodeDetail();
    const { attributes } = node;
    const [token, setToken] = useState<DeployToken | null>(null);
    const generateDeployToken = useGenerateAdminNodeDeployToken();

    const query = useAdminNodeConfiguration(attributes.id);

    const generate = () => {
        generateDeployToken.mutate(generateAdminNodeDeployTokenInput(attributes.id), {
            onSuccess: setToken,
        });
    };

    const insecureFlag = token?.allow_insecure ? ' --allow-insecure' : '';
    const command = token
        ? `cd /etc/pterodactyl && sudo wings configure --panel-url ${token.panel_url} --token ${token.token} --node ${token.node}${insecureFlag}`
        : '';

    return (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <Dialog open={token !== null} title='已生成自动部署命令' onClose={() => setToken(null)}>
                <p className='text-sm text-muted-foreground mb-4'>
                    在目标机器上运行以下命令，即可自动为此节点配置 Wings。
                </p>
                <div className='relative'>
                    <CopyOnClick text={command} showInNotification={false}>
                        <Button.Text
                            type='button'
                            size='xsmall'
                            isSecondary
                            aria-label='复制自动部署命令'
                            className='absolute right-2 top-2'
                        >
                            <Icon icon={Copy} className='h-3.5 w-3.5' />
                        </Button.Text>
                    </CopyOnClick>
                    <pre className='whitespace-pre-wrap break-all rounded-sm border border-border bg-sunken p-4 pr-12 font-mono text-xs leading-relaxed text-foreground'>
                        {command}
                    </pre>
                </div>
            </Dialog>
            <div className='lg:col-span-2'>
                <TitledGreyBox title='配置文件'>
                    <ConfigurationFile query={query} />
                    <p className='text-xs text-muted-foreground mt-3'>
                        将此文件放置到守护进程的根目录（通常为 <code>/etc/pterodactyl</code>）下，文件名为{' '}
                        <code>config.yml</code>.
                    </p>
                </TitledGreyBox>
            </div>
            <div>
                <TitledGreyBox title='自动部署'>
                    <p className='text-sm text-muted-foreground mb-4'>
                        生成自定义部署命令，一条命令即可在目标服务器上完成 Wings 配置。
                    </p>
                    <Button
                        color='green'
                        disabled={generateDeployToken.isPending}
                        isLoading={generateDeployToken.isPending}
                        onClick={generate}
                        className='w-full'
                    >
                        生成令牌
                    </Button>
                </TitledGreyBox>
            </div>
        </div>
    );
}
