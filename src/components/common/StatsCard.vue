<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: String,
})
</script>

<template>
  <v-card elevation="2">
    <v-card-text>
      <div class="d-flex justify-space-between align-center">
        <div>
          <div class="text-caption text-grey">
            {{ title }}
          </div>

          <div class="text-h4 mt-2">
            {{ value }}
          </div>
        </div>

        <v-icon
          size="40"
          color="primary"
        >
          {{ icon }}
        </v-icon>
      </div>
    </v-card-text>
  </v-card>
</template>