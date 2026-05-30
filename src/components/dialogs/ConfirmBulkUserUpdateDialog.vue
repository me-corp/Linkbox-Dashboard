<script setup>
defineProps({
  modelValue: Boolean,
  items: Array,
  loading: Boolean,
})

const emit = defineEmits([
  'update:modelValue',
  'confirm',
])
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1000"
  >
    <v-card>

      <v-card-title>
        Bulk Apply Suggested Fixes
      </v-card-title>

      <v-card-text>

        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          {{
            items?.length
          }}
          users will be updated
        </v-alert>

        <v-table>
          <thead>
            <tr>
              <th>User</th>
              <th>Changes</th>
            </tr>
          </thead>

          <tbody>

            <tr
              v-for="item in items"
              :key="item.user.id"
            >
              <td>
                {{ item.user.name }}

                <br>

                <small>
                  {{
                    item.user.username
                  }}
                </small>
              </td>

              <td>

                <div
                  v-for="
                    (
                      value,
                      key
                    )
                    in item.suggestedFix
                  "
                  :key="key"
                >
                  <strong>
                    {{ key }}
                  </strong>

                  →

                  {{ value }}
                </div>

              </td>
            </tr>

          </tbody>
        </v-table>

      </v-card-text>

      <v-card-actions>

        <v-spacer />

        <v-btn
          @click="
            emit(
              'update:modelValue',
              false
            )
          "
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          :loading="loading"
          @click="
            emit('confirm')
          "
        >
          Apply
        </v-btn>

      </v-card-actions>

    </v-card>
  </v-dialog>
</template>