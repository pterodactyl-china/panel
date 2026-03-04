import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import AllocationRow from '@/components/server/network/AllocationRow';
import Button from '@/components/elements/Button';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import tw from 'twin.macro';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import getServerAllocations from '@/api/swr/getServerAllocations';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { useStoreState } from 'easy-peasy';

const NetworkContainer = () => {
    const [loading, setLoading] = useState(false);
    const [consecutiveCount, setConsecutiveCount] = useState(1);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const consecutiveEnabled = useStoreState((state) => state.settings.data?.allocations?.consecutiveEnabled ?? false);
    const consecutiveLimit = useStoreState((state) => state.settings.data?.allocations?.consecutiveLimit ?? 3);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, []);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((state) => ({ ...state, allocations: data }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();

        const count = consecutiveEnabled && consecutiveCount > 1 ? consecutiveCount : undefined;
        setLoading(true);
        createServerAllocation(uuid, count)
            .then((newAllocations) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(newAllocations) }));
                return mutate(data?.concat(newAllocations), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    return (
        <ServerContentBlock showFlashKey={'server:network'} title={'网络'}>
            {!data ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    {data.map((allocation) => (
                        <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                    ))}
                    {allocationLimit > 0 && (
                        <Can action={'allocation.create'}>
                            <SpinnerOverlay visible={loading} />
                            <div css={tw`mt-6 sm:flex items-center justify-end`}>
                                <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                                    你正在使用 {data.length} / {allocationLimit} 个允许的网络设置。
                                </p>
                                {allocationLimit > data.length && (
                                    <div css={tw`flex items-center space-x-3`}>
                                        {consecutiveEnabled && (
                                            <div css={tw`flex items-center space-x-2`}>
                                                <label css={tw`text-sm text-neutral-300 whitespace-nowrap`}>
                                                    连续端口数:
                                                </label>
                                                <input
                                                    type={'number'}
                                                    min={1}
                                                    max={Math.min(consecutiveLimit, allocationLimit - data.length)}
                                                    value={consecutiveCount}
                                                    onChange={(e) =>
                                                        setConsecutiveCount(
                                                            Math.max(
                                                                1,
                                                                Math.min(
                                                                    consecutiveLimit,
                                                                    parseInt(e.target.value) || 1
                                                                )
                                                            )
                                                        )
                                                    }
                                                    css={tw`w-16 bg-neutral-800 text-neutral-200 border border-neutral-600 rounded px-2 py-1 text-sm`}
                                                />
                                            </div>
                                        )}
                                        <Button
                                            css={tw`w-full sm:w-auto`}
                                            color={'primary'}
                                            onClick={onCreateAllocation}
                                        >
                                            创建新的网络设置
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Can>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};

export default NetworkContainer;
