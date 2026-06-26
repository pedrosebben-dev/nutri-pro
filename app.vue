<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { fetchMe } = useAuth()

onMounted(() => {
  fetchMe()
})
</script>
