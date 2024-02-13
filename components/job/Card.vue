<script setup lang="ts">
  const localePath = useLocalePath()

  export interface Job {
    jobUID: string
    title: string
    description: string
    companyName: string
    companyLogo: string
    jobType: string
    location: string
    deadline: string
  }

  const props = defineProps({
    content: {
      type: Object as PropType<Job>,
      required: true,
    },
  })

  const date = computed(() => new Date(props.content.deadline))
</script>

<template>
  <div
    class="job-wrapper d-flex rounded-lg elevation-2 px-md-7 py-md-3"
    @click="navigateTo(localePath(`/jobs/${content.jobUID}`))"
  >
    <NuxtImg :src="content.companyLogo" />
    <VDivider vertical class="my-2 ml-2" />
    <VCard
      class="flex-grow-1"
      flat
      :subtitle="
        $t(`admin.jobs.attributes.jobtype.${content.jobType.replace('-', '_')}`)
      "
    >
      <template #title>
        {{ content.title }}
      </template>

      <template #subtitle>
        <div class="d-flex justify-space-between">
          <span class="title mr-1">
            {{
              $t(
                `admin.jobs.attributes.jobtype.${content.jobType.replace(
                  '-',
                  '_'
                )}`
              )
            }}
            -
            {{ content.location }}
          </span>
          <span class="d-none d-sm-flex">
            {{ $t('jobs.deadline') }}: {{ date.getDate() }}.
            {{ getFullMonthFromNumber(date.getMonth()) }}
            {{ date.getFullYear() }}
          </span>
        </div>
      </template>

      <p class="px-4 mb-4 text-subtitle-2">{{ content.description }}</p>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  img {
    object-fit: contain;
    margin: 0.625rem;
    width: 175px;
    max-height: 125px;

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      width: 125px;
    }
  }

  .v-card {
    background-color: transparent;

    > p {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .job-wrapper {
    cursor: pointer;
    transition: 0.2s;

    &:hover {
      background-color: rgba(151, 151, 151, 0.14);
    }
  }

  .title {
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
