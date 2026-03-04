import { Allocation } from '@/api/server/getServer';
import http, { FractalResponseList } from '@/api/http';
import { rawDataToServerAllocation } from '@/api/transformers';

export default async (uuid: string, count?: number): Promise<Allocation[]> => {
    const { data } = await http.post(
        `/api/client/servers/${uuid}/network/allocations`,
        count && count > 1 ? { count } : {}
    );

    if (data.object === 'list') {
        return (data as FractalResponseList).data.map(rawDataToServerAllocation);
    }

    return [rawDataToServerAllocation(data)];
};
