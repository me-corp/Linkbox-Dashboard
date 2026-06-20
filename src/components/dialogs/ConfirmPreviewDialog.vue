<script setup>
defineProps({
    modelValue:  Boolean,
    link:        Object,  // the link document
    scraper:     Object,  // scrapper API result
    linkPreview: Object,  // linkpreview.net result (may be null)
    displayUpdates: Object, // sanitised updates for display (no serverTimestamp)
    loading:     Boolean,
})

const emit = defineEmits(['update:modelValue', 'confirm'])
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        max-width="680"
        scrollable
        @update:model-value="emit('update:modelValue', $event)"
    >
        <v-card v-if="scraper || linkPreview">
            <v-card-title class="bg-primary text-white">
                Confirm Preview Update
            </v-card-title>

            <v-card-text>
                <!-- Link identity -->
                <div class="mb-4">
                    <div class="text-caption text-medium-emphasis mb-1">LINK</div>
                    <div class="font-weight-bold">{{ link?.title || '(no title)' }}</div>
                    <div class="text-caption text-medium-emphasis text-truncate">
                        {{ link?.link || link?.url }}
                    </div>
                    <v-chip size="x-small" variant="tonal" class="mt-1">
                        ID: {{ link?.id }}
                    </v-chip>
                </div>

                <v-divider class="mb-4" />

                <!-- Visual preview -->
                <div class="text-caption text-medium-emphasis mb-2">FETCHED PREVIEW</div>

                <v-card variant="outlined" class="mb-4">
                    <v-img
                        v-if="scraper?.image || linkPreview?.image"
                        :src="linkPreview?.image || scraper?.image"
                        height="140"
                        cover
                        class="rounded-t"
                    />
                    <v-card-text class="pb-2">
                        <div class="d-flex align-center ga-2 mb-1">
                            <v-img
                                v-if="scraper?.favicon"
                                :src="scraper.favicon"
                                width="14"
                                height="14"
                                style="flex: none"
                            />
                            <span class="text-caption text-medium-emphasis">
                                {{ scraper?.provider || scraper?.url || linkPreview?.url }}
                            </span>
                        </div>
                        <div class="font-weight-bold text-body-2">
                            {{ linkPreview?.title || scraper?.title || '(no title)' }}
                        </div>
                        <div
                            v-if="linkPreview?.description || scraper?.description"
                            class="text-caption text-medium-emphasis mt-1"
                            style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden"
                        >
                            {{ linkPreview?.description || scraper?.description }}
                        </div>
                    </v-card-text>
                </v-card>

                <!-- API source badges -->
                <div class="d-flex ga-2 mb-4">
                    <v-chip
                        size="x-small"
                        :color="linkPreview ? 'success' : 'grey'"
                        variant="tonal"
                    >
                        linkpreview.net: {{ linkPreview ? 'OK' : 'skipped' }}
                    </v-chip>
                    <v-chip
                        size="x-small"
                        :color="scraper ? 'success' : 'error'"
                        variant="tonal"
                    >
                        scrapper: {{ scraper ? 'OK' : 'failed' }}
                    </v-chip>
                </div>

                <v-divider class="mb-3" />

                <!-- Fields to be written -->
                <div class="text-caption text-medium-emphasis mb-2">FIELDS TO BE WRITTEN</div>

                <v-sheet
                    rounded="md"
                    color="surface-bright"
                    class="pa-3"
                    style="font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; max-height: 260px; overflow-y: auto"
                >{{ JSON.stringify({ linkId: link?.id, ...displayUpdates }, null, 2) }}</v-sheet>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn :disabled="loading" @click="emit('update:modelValue', false)">
                    Cancel
                </v-btn>
                <v-btn color="primary" :loading="loading" @click="emit('confirm')">
                    Apply Preview
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
