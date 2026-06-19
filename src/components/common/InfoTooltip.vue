<script setup>
defineProps({
  text: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <v-tooltip :text="text" max-width="280" location="top">
    <template #activator="{ props }">
      <v-icon
        v-bind="props"
        size="14"
        class="info-tooltip-icon ml-1"
      >
        mdi-information-outline
      </v-icon>
    </template>
  </v-tooltip>
</template>

<style scoped>
.info-tooltip-icon {
  opacity: 0.45;
  cursor: default;
  vertical-align: middle;
  transition: opacity 0.15s;
}
.info-tooltip-icon:hover {
  opacity: 0.9;
}
</style>
