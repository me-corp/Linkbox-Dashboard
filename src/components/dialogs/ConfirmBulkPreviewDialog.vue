<script setup>
// items: [{ link, scraper, linkPreview }]
// linkPreview.net takes priority for title/image; scraper provides favicon/provider
defineProps({
    modelValue: Boolean,
    items:      Array,
    loading:    Boolean,
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function resolvedTitle(item) {
    return item.linkPreview?.title || item.scraper?.title || item.link?.title || item.link?.id
}

function resolvedFavicon(item) {
    return item.scraper?.favicon || null
}

function isEmpty(item) {
    const title = item.linkPreview?.title || item.scraper?.title
    const desc  = item.linkPreview?.description || item.scraper?.description
    return !title && !desc
}
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        max-width="560"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <v-card>
            <v-card-title>Apply Previews to Selected Links</v-card-title>

            <v-card-text>
                <v-alert type="info" variant="tonal" density="comfortable" class="mb-4">
                    <strong>{{ items?.length }}</strong> links will be updated.
                    Basic fields (imageUrl, title, description) come from
                    <strong>linkpreview.net</strong>; metadata from the
                    <strong>scrapper</strong>.
                </v-alert>

                <v-list density="compact" class="overflow-y-auto" style="max-height: 320px">
                    <v-list-item
                        v-for="item in items"
                        :key="item.link.id"
                        class="px-0"
                    >
                        <template #prepend>
                            <v-img
                                v-if="resolvedFavicon(item)"
                                :src="resolvedFavicon(item)"
                                width="16"
                                height="16"
                                style="flex: none"
                                class="mr-3"
                            />
                            <v-icon v-else size="16" class="mr-3">mdi-link-variant</v-icon>
                        </template>

                        <v-list-item-title class="text-body-2 font-weight-medium">
                            {{ resolvedTitle(item) }}
                        </v-list-item-title>

                        <v-list-item-subtitle class="text-caption">
                            {{ item.link.link || item.link.url }}
                        </v-list-item-subtitle>

                        <template #append>
                            <div class="d-flex ga-1">
                                <v-chip
                                    size="x-small"
                                    :color="item.linkPreview ? 'success' : 'grey'"
                                    variant="tonal"
                                >
                                    lp.net
                                </v-chip>
                                <v-chip
                                    size="x-small"
                                    :color="item.scraper ? 'success' : 'grey'"
                                    variant="tonal"
                                >
                                    scraper
                                </v-chip>
                                <v-chip
                                    v-if="isEmpty(item)"
                                    size="x-small"
                                    color="warning"
                                    variant="tonal"
                                >
                                    empty
                                </v-chip>
                            </div>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn :disabled="loading" @click="emit('update:modelValue', false)">
                    Cancel
                </v-btn>
                <v-btn color="primary" :loading="loading" @click="emit('confirm')">
                    Apply All
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
