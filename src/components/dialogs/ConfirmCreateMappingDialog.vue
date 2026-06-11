<script setup>
    defineProps({
        modelValue: Boolean,
        folder: Object,
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
        <v-card v-if="folder">

            <v-card-title class="bg-primary text-white">
                Create Audience Mapping
            </v-card-title>

            <v-card-text>
                <v-alert type="info" variant="tonal" class="mb-4">
                    This folder has no
                    <code>folders_audience</code>
                    mapping, so the mobile app can never discover it
                    (or its links) for this user.
                </v-alert>

                <div class="mb-4">
                    <div class="text-h6">
                        {{ folder.title || folder.id }}
                    </div>

                    <div class="text-caption">
                        {{ folder.id }}
                    </div>
                </div>

                <v-divider class="mb-4" />

                <div class="font-weight-medium mb-2">
                    A new folders_audience document will be created:
                </div>

                <v-table density="compact">
                    <tbody>
                        <tr>
                            <td>userId</td>
                            <td>{{ folder.userId }}</td>
                        </tr>
                        <tr>
                            <td>folderId</td>
                            <td>{{ folder.id }}</td>
                        </tr>
                        <tr>
                            <td>role</td>
                            <td>1 (Owner)</td>
                        </tr>
                        <tr>
                            <td>isFavourite</td>
                            <td>FALSE</td>
                        </tr>
                        <tr>
                            <td>isHidden</td>
                            <td>FALSE</td>
                        </tr>
                        <tr>
                            <td>isDeleted</td>
                            <td>FALSE</td>
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
                    Create Mapping
                </v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>
