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
import { ApplicationStore } from '@/state';

const NetworkContainer = () => {
    const [loading, setLoading] = useState(false);
    const [consecutiveCount, setConsecutiveCount] = useState(1);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const consecutiveEnabled = useStoreState(
        (state: ApplicationStore) => state.settings.data?.allocations?.consecutiveEnabled ?? false
    );
    const consecutiveLimit = useStoreState(
        (state: ApplicationStore) => state.settings.data?.allocations?.consecutiveLimit ?? 3
    );

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

        setLoading(true);
        createServerAllocation(uuid, consecutiveCount)
            .then((newAllocations) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(newAllocations) }));
                return mutate(data?.concat(newAllocations), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    const remainingAllocations = allocationLimit - (data?.length ?? 0);
    const maxCount = consecutiveEnabled ? Math.min(consecutiveLimit, remainingAllocations) : 1;

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
                                    <div css={tw`flex items-center`}>
                                        {consecutiveEnabled && maxCount > 1 && (
                                            <div css={tw`flex items-center mr-3`}>
                                                <label css={tw`text-sm text-neutral-300 mr-2 whitespace-nowrap`}>
                                                    连续端口数量：
                                                </label>
                                                <select
                                                    css={tw`bg-neutral-700 border border-neutral-600 text-neutral-200 text-sm rounded px-2 py-1`}
                                                    value={consecutiveCount}
                                                    onChange={(e) => setConsecutiveCount(parseInt(e.target.value, 10))}
                                                >
                                                    {Array.from({ length: maxCount }, (_, i) => i + 1).map((n) => (
                                                        <option key={n} value={n}>
                                                            {n}
                                                        </option>
                                                    ))}
                                                </select>
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
