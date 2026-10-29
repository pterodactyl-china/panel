import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { removeListItems, upsertListItem } from '@/api/queryData';
import {
    clientCreateServerDatabaseMutation,
    clientDeleteServerDatabaseMutation,
    clientListServerDatabasesOptions,
    clientListServerDatabasesQueryKey,
    clientRotateServerDatabasePasswordMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type {
    ClientCreateServerDatabaseData,
    ClientDeleteServerDatabaseData,
    ClientListServerDatabasesData,
    ClientListServerDatabasesResponse,
    ClientRotateServerDatabasePasswordData,
    ClientServerDatabaseResource,
    Options,
} from '@/api/generated';
import { notifyHttpError } from '@/plugins/notifications';

export type ServerDatabase = ClientServerDatabaseResource;

const serverDatabasesInput = (uuid: string): Options<ClientListServerDatabasesData> => ({
    path: { server_uuid: uuid },
    query: { include: 'password' },
});

export const createServerDatabaseInput = (
    uuid: string,
    values: { connectionsFrom: string; databaseName: string }
): Options<ClientCreateServerDatabaseData> => ({
    path: { server_uuid: uuid },
    body: {
        database: values.databaseName,
        remote: values.connectionsFrom,
    },
    query: { include: 'password' },
});

export const rotateServerDatabasePasswordInput = (
    uuid: string,
    databaseId: string
): Options<ClientRotateServerDatabasePasswordData> => ({
    path: { server_uuid: uuid, database_id: databaseId },
    query: { include: 'password' },
});

export const deleteServerDatabaseInput = (
    uuid: string,
    database: ServerDatabase
): Options<ClientDeleteServerDatabaseData> => ({
    path: { server_uuid: uuid, database_id: database.attributes.id },
    meta: { name: database.attributes.name },
});

export const serverDatabasesQueryOptions = (uuid: string) =>
    clientListServerDatabasesOptions(serverDatabasesInput(uuid));

export const useServerDatabases = (uuid: string) =>
    useQuery({ ...serverDatabasesQueryOptions(uuid), enabled: uuid.length > 0 });

const upsertDatabase = async (queryClient: QueryClient, uuid: string, database: ServerDatabase) => {
    await queryClient.cancelQueries({ queryKey: clientListServerDatabasesQueryKey(serverDatabasesInput(uuid)) });

    return queryClient.setQueryData<ClientListServerDatabasesResponse>(
        clientListServerDatabasesQueryKey(serverDatabasesInput(uuid)),
        (current) =>
            upsertListItem(
                current,
                database,
                (item) => item.attributes.id === database.attributes.id,
                (item) => ({ object: 'list', data: [item] })
            )
    );
};

const removeDatabase = async (queryClient: QueryClient, uuid: string, databaseId: string) => {
    await queryClient.cancelQueries({ queryKey: clientListServerDatabasesQueryKey(serverDatabasesInput(uuid)) });

    return queryClient.setQueryData<ClientListServerDatabasesResponse>(
        clientListServerDatabasesQueryKey(serverDatabasesInput(uuid)),
        (current) => removeListItems(current, (database) => database.attributes.id === databaseId)
    );
};

export const useCreateServerDatabase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientCreateServerDatabaseMutation(),
        onSuccess: async (database, { path }) => {
            await upsertDatabase(queryClient, path.server_uuid, database);
            toast.success('数据库已创建', { description: `${database.attributes.name} 已可使用。` });
        },
        onError: (error) => notifyHttpError(error, '无法创建数据库'),
    });
};

export const useDeleteServerDatabase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientDeleteServerDatabaseMutation(),
        onSuccess: async (_data, variables) => {
            await removeDatabase(queryClient, variables.path.server_uuid, variables.path.database_id);
            const name = variables.meta?.name;

            toast.success('数据库已删除', { description: name ? `${name} 已移除。` : undefined });
        },
        onError: (error) => notifyHttpError(error, '无法删除数据库'),
    });
};

export const useRotateDatabasePassword = () => {
    const queryClient = useQueryClient();

    return useMutation({
        ...clientRotateServerDatabasePasswordMutation(),
        onSuccess: async (database, { path }) => {
            await upsertDatabase(queryClient, path.server_uuid, database);
            toast.success('数据库密码已轮换', {
                description: `${database.attributes.name} 的密码已重置。`,
            });
        },
        onError: (error) => notifyHttpError(error, '无法轮换数据库密码'),
    });
};
