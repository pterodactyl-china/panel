import { httpErrorToHuman } from '@/api/http';
import { useAdminEgg } from '@/api/admin/eggs/queries';
import { syncAdminEggTagsInput, type AdminTag, useAllAdminTags, useSyncAdminEggTags } from '@/api/admin/tags/queries';
import NoTagsYet from '@/components/admin/tags/NoTagsYet';
import TagsField from '@/components/admin/tags/TagsField';
import ContentBox from '@/components/elements/ContentBox';
import { ServerError } from '@/components/elements/ScreenBlock';
import Spinner from '@/components/elements/Spinner';
import { Form, useAppForm } from '@/components/form';
import { eggDetailRoute } from '@/router/routeTree';

export default function EggTagsTab() {
    const loadedEgg = eggDetailRoute.useLoaderData();
    const eggId = loadedEgg.attributes.id;
    const { data: egg = loadedEgg, error: eggError, refetch } = useAdminEgg(eggId);
    const { data: tags = [], error: tagsError, refetch: refetchTags, isPending: tagsPending } = useAllAdminTags();
    const syncTags = useSyncAdminEggTags();
    const relationship = egg.attributes.relationships?.tags;
    const assignedTags: AdminTag[] = relationship && 'data' in relationship ? relationship.data : [];
    const form = useAppForm({
        defaultValues: { tags: assignedTags.map((tag) => String(tag.attributes.id)) },
        onSubmit: async ({ value }) => {
            try {
                const saved = await syncTags.mutateAsync(syncAdminEggTagsInput(eggId, value.tags));

                form.reset({ tags: saved.data.map((tag) => String(tag.attributes.id)) });
            } catch {
                // Error toast is handled by the mutation.
            }
        },
    });

    if (eggError || tagsError) {
        return (
            <ServerError
                message={httpErrorToHuman(eggError ?? tagsError)}
                onRetry={() => {
                    if (eggError) {
                        void refetch();
                    }

                    if (tagsError) {
                        void refetchTags();
                    }
                }}
            />
        );
    }

    if (tagsPending) {
        return <Spinner size='large' centered />;
    }

    return (
        <ContentBox title='预设标签'>
            {tags.length === 0 && <NoTagsYet />}
            <Form form={form} className='m-0'>
                <form.AppField name='tags'>
                    {() => (
                        <TagsField
                            tags={tags}
                            label='已分配标签'
                            description='标签用于组织预设，并将其与配置为接受这些标签的节点匹配。'
                            emptyText='此预设未分配标签。'
                        />
                    )}
                </form.AppField>
                <div className='mt-6 flex justify-end'>
                    <form.AppForm>
                        <form.SubmitButton>保存标签</form.SubmitButton>
                    </form.AppForm>
                </div>
            </Form>
        </ContentBox>
    );
}
