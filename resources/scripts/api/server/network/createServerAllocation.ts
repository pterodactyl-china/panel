import { Allocation } from '@/api/server/getServer';
import http from '@/api/http';
import { rawDataToServerAllocation } from '@/api/transformers';

export default async (uuid: string, count = 1): Promise<Allocation[]> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/network/allocations`, count > 1 ? { count } : {});

    if (count > 1) {
        return (data.data || []).map(rawDataToServerAllocation);
    }

    return [rawDataToServerAllocation(data)];
};
