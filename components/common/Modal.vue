<template>
  <div class="modal">
    <VBtn
      class="modal__close ma-4"
      icon="mdi-close"
      color="background"
      variant="plain"
      @click="$emit('close-modal')"
    />

    <slot class="modal__content" />
  </div>
</template>

<style scoped lang="scss">
  .modal {
    display: grid; /* Hidden by default */
    place-items: center;
    position: fixed; /* Stay in place */
    z-index: 10000; /* Sit on top */
    padding-top: 90px; /* Location of the box */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0, 0, 0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.65); /* Black w/ opacity */

    &__close {
      position: fixed;
      right: 0;
      top: 0;
    }

    &__content {
      margin: auto;
      display: block;
      width: 80%;
      max-width: 100vw;
      max-width: 100vh;
    }
  }
</style>
