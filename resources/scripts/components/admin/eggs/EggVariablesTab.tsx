import { Variable } from 'lucide-react';
import { useAdminEggVariables } from '@/api/admin/eggs/queries';
import { useEggDetail } from '@/components/admin/eggs/useEggDetail';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import EggVariableBox from '@/components/admin/eggs/EggVariableBox';
import CreateEggVariableButton from '@/components/admin/eggs/CreateEggVariableButton';
import ListToolbar from '@/components/elements/ListToolbar';
import { httpErrorToHuman } from '@/api/http';
import { Alert } from '@/components/elements/alert';
import Button from '@/components/elements/Button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export default function EggVariablesTab() {
    const egg = useEggDetail();
    const { data: variables, error, isFetching, refetch } = useAdminEggVariables(egg.attributes.id);

    const renderVariables = () => {
        if (!variables) {
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

            return <Spinner size='large' centered />;
        }

        if (variables.data.length === 0) {
            return (
                <TitledGreyBox title='预设变量'>
                    <Empty size='compact'>
                        <EmptyHeader>
                            <EmptyMedia variant='icon'>
                                <Variable />
                            </EmptyMedia>
                            <EmptyTitle>没有变量</EmptyTitle>
                            <EmptyDescription>变量让服务器所有者可以配置启动命令与环境。</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <CreateEggVariableButton eggId={egg.attributes.id} />
                        </EmptyContent>
                    </Empty>
                </TitledGreyBox>
            );
        }

        return (
            <div aria-busy={isFetching} className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {variables.data.map((variable) => (
                    <EggVariableBox key={variable.attributes.id} eggId={egg.attributes.id} variable={variable} />
                ))}
            </div>
        );
    };

    return (
        <div>
            <ListToolbar className='mb-6'>
                <CreateEggVariableButton eggId={egg.attributes.id} />
            </ListToolbar>
            {renderVariables()}
        </div>
    );
}
