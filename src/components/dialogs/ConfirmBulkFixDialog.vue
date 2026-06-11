<script setup>
    defineProps({
        modelValue: Boolean,
        title: String,
        itemLabel: String,
        count: Number,
        fieldCounts: Object,
        loading: Boolean,
    })

    const emit =
        defineEmits([
            'update:modelValue',
            'confirm',
        ])
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="600" @update:model-value="emit('update:modelValue', $event)">
        <v-card>

            <v-card-title>
                {{ title }}
            </v-card-title>

            <v-card-text>
                <v-alert type="warning" variant="tonal" class="mb-4">
                    {{ count }}
                    {{ itemLabel }}
                    will be updated
                </v-alert>

                <v-table>
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Items affected</th>
                            <th>New value</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="(fieldCount, field) in fieldCounts" :key="field">
                            <td>{{ field }}</td>
                            <td>{{ fieldCount }}</td>
                            <td>
                                <v-chip color="success" variant="tonal" size="small">
                                    FALSE
                                </v-chip>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>

            <v-card-actions>
                <v-spacer />

                <v-btn :disabled="loading" @click="emit('update:modelValue', false)">
                    Cancel
                </v-btn>

                <v-btn color="primary" :loading="loading" :disabled="loading" @click="emit('confirm')">
                    Apply to All
                </v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>
