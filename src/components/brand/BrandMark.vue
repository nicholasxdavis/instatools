<template>
  <router-link class="brand-link" to="/" aria-label="Instatools home">
    <img class="brand" src="/logo.png" width="190" height="26" alt="Instatools" />
  </router-link>
</template>

<style scoped>
.brand-link {
  display: flex;
  align-items: center;
  min-width: 0;
}
.brand {
  display: block;
  height: 26px;
  width: auto;
  max-width: 190px;
  object-fit: contain;
  object-position: left center;
}
</style>
