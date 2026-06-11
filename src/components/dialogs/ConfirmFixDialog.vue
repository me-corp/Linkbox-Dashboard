<script setup>
    defineProps({
        modelValue: Boolean,
        title: String,
        itemLabel: String,
        itemSubLabel: String,
        current: Object,
        updates: Object,
        loading: Boolean,
    })

    const emit =
        defineEmits([
            'update:modelValue',
            'confirm',
        ])

    function formatValue(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return 'NULL'
        }

        if (value === true) {
            return 'TRUE'
        }

        if (value === false) {
            return 'FALSE'
        }

        return value
    }
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="600" @update:model-value="emit('update:modelValue', $event)">
        <v-card v-if="updates">

            <v-card-title class="bg-primary text-white">
                {{ title }}
            </v-card-title>

            <v-card-text>
                <div class="mb-4">
                    <div class="text-h6">
                        {{ itemLabel }}
                    </div>

                    <div v-if="itemSubLabel" class="text-caption">
                        {{ itemSubLabel }}
                    </div>
                </div>

                <v-divider class="mb-4" />

                <div v-for="(value, key) in updates" :key="key" class="mb-4">
                    <div class="font-weight-medium mb-2">
                        {{ key }}
                    </div>

                    <div class="d-flex align-center ga-4">
                        <v-chip color="error" variant="tonal">
                            {{ formatValue(current?.[key]) }}
                        </v-chip>

                        <v-icon>
                            mdi-arrow-right
                        </v-icon>

                        <v-chip color="success" variant="tonal">
                            {{ formatValue(value) }}
                        </v-chip>
                    </div>
                </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer />

                <v-btn :disabled="loading" @click="emit('update:modelValue', false)">
                    Cancel
                </v-btn>

                <v-btn color="primary" :loading="loading" :disabled="loading" @click="emit('confirm')">
                    Apply Changes
                </v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>
