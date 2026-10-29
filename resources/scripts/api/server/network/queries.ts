import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { mapListItems, removeListItems, upsertListItem } from '@/api/queryData';
import {
    clientCreateServerAllocationMutation,
    clientDeleteServerAllocationMutation,
    clientListServerAllocationsOptions,
    clientListServerAllocationsQueryKey,
    clientSetPrimaryAllocationMutation,
    clientUpdateAllocationNotesMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type {
    ClientCreateServerAllocationData,
    ClientDeleteServerAllocationData,
    ClientListServerAllocationsData,
    ClientListServerAllocationsResponse,
    ClientSetPrimaryAllocationData,
    ClientUpdateAllocationNotesData,
    Options,
} from '@/api/generated';
import { notifyHttpError } from '@/plugins/notifications';
import { serverQueryFilters } from '@/api/server/queries';

export type ServerAllocation = ClientListServerAllocationsResponse['data'][number];

const serverAllocationsInput = (uuid: string): Options<ClientListServerAllocationsData> => ({
    path: { server_uuid: uuid },
});

export const createServerAllocationInput = (uuid: string): Options<ClientCreateServerAllocationData> => ({
    path: { server_uuid: uuid },
});

export const updateAllocationNotesInput = (
    uuid: string,
    allocation: number,
    notes: string
): Options<ClientUpdateAllocationNotesData> => ({
    path: { server_uuid: uuid, allocation_id: allocation },
    body: { notes },
});

export const setPrimaryAllocationInput = (
    uuid: string,
    allocation: number
): Options<ClientSetPrimaryAllocationData> => ({
    path: { server_uuid: uuid, allocation_id: allocation },
});

export const deleteServerAllocationInput = (
    uuid: string,
    allocation: number
): Options<ClientDeleteServerAllocationData> => ({
    path: { server_uuid: uuid, allocation_id: allocation },
});

export const serverAllocationsQueryOptions = (uuid: string): ReturnType<typeof clientListServerAllocationsOptions> => ({
    ...clientListServerAllocationsOptions(serverAllocationsInput(uuid)),
});

export const useServerAllocations = (uuid: string) =>
    useQuery({ ...serverAllocationsQueryOptions(uuid), enabled: uuid.length > 0 });

const upsertAllocation = async (queryClient: QueryClient, uuid: string, allocation: ServerAllocation) => {
    await queryClient.cancelQueries({ queryKey: clientListServerAllocationsQueryKey(serverAllocationsInput(uuid)) });

    return queryClient.setQueryData<ClientListServerAllocationsResponse>(
        clientListServerAllocationsQueryKey(serverAllocationsInput(uuid)),
        (current) => upsertListItem(current, allocation, (item) => item.attributes.id === allocation.attributes.id)
    );
};

const removeAllocation = async (queryClient: QueryClient, uuid: string, allocationId: number) => {
    await queryClient.cancelQueries({ queryKey: clientListServerAllocationsQueryKey(serverAllocationsInput(uuid)) });

    return queryClient.setQueryData<ClientListServerAllocationsResponse>(
        clientListServerAllocationsQueryKey(serverAllocationsInput(uuid)),
        (current) => removeListItems(current, (allocation) => allocation.attributes.id === allocationId)
    );
};

export const useCreateServerAllocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientCreateServerAllocationMutation(),
        onSuccess: async (allocation, { path }) => {
            await upsertAllocation(queryClient, path.server_uuid, allocation);
            toast.success('分配已创建', {
                description: `${allocation.attributes.ip}:${allocation.attributes.port} 现可用。`,
            });
        },
        onError: (error) => notifyHttpError(error, '无法创建分配'),
    });
};

export const useUpdateAllocationNotes = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientUpdateAllocationNotesMutation(),
        onSuccess: (allocation, { path }) => upsertAllocation(queryClient, path.server_uuid, allocation),
        onError: (error) => notifyHttpError(error, '无法更新分配备注'),
    });
};

export const useSetPrimaryAllocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientSetPrimaryAllocationMutation(),
        onSuccess: async (_data, { path }) => {
            await queryClient.cancelQueries({
                queryKey: clientListServerAllocationsQueryKey(serverAllocationsInput(path.server_uuid)),
            });
            queryClient.setQueryData<ClientListServerAllocationsResponse>(
                clientListServerAllocationsQueryKey(serverAllocationsInput(path.server_uuid)),
                (current) =>
                    mapListItems(current, (allocation) => ({
                        ...allocation,
                        attributes: {
                            ...allocation.attributes,
                            is_default: allocation.attributes.id === path.allocation_id,
                        },
                    }))
            );
            await queryClient.invalidateQueries(serverQueryFilters(path.server_uuid));
            toast.success('首选分配已更新');
        },
        onError: (error) => notifyHttpError(error, '无法更新首选分配'),
    });
};

export const useDeleteServerAllocation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientDeleteServerAllocationMutation(),
        onSuccess: async (_data, { path }) => {
            await removeAllocation(queryClient, path.server_uuid, path.allocation_id);
            toast.success('分配已删除');
        },
        onError: (error) => notifyHttpError(error, '无法删除分配'),
    });
};
