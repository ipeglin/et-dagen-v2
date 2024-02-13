<script setup lang="ts">
  const useAuth = useAuthStore()

  // get event id from route
  const route = useRoute()
  const eventUid = route.params.id

  // fetch event information from query
  const { data, refresh } = await useFetch('/api/event', {
    method: 'GET',
    query: {
      eventUID: eventUid,
    },
  })

  // fetch all companies
  const { data: companies } = await useFetch('/api/company')

  // embed uid into object
  const event = computed(() => embedKeyIntoObjectValues(data.value)[0])

  // get company information
  const company = computed(
    () => companies.value[event.value.companyUID] || null
  )

  // check if event has capacity and attendants
  const hasAttendants = computed(
    () => !!event.value.attendants || Object.hasOwn(event.value, 'attendants')
  )
  const hasCapacity = computed(() => !!event.value.capacity)

  // get day and month strings from date
  const eventStartString = computed(
    () =>
      `${getDayAndMonthString(
        event.value.date.start
      )} ${getHourAndMinuteStringFromString(event.value.date.start)}`
  )
  const eventEndString = computed(
    () =>
      `${getDayAndMonthString(
        event.value.date.end
      )} ${getHourAndMinuteStringFromString(event.value.date.end)}`
  )

  // get day and month strings from date
  const registrationStartString = computed(() =>
    hasCapacity.value
      ? `${getDayAndMonthString(
          event.value.registration.start
        )} ${getHourAndMinuteStringFromString(event.value.registration.start)}`
      : null
  )
  const registrationEndString = computed(() =>
    hasCapacity.value
      ? `${getDayAndMonthString(
          event.value.registration.end
        )} ${getHourAndMinuteStringFromString(event.value.registration.end)}`
      : null
  )

  const programmeRequirements = computed(
    () => event.value?.registration?.requirements?.programmes ?? null
  )

  const hasYearsRequirements = computed(
    () => event.value?.registration?.requirements?.years ?? null
  )

  // check if user meets registration requirements
  const meetsProgrammeRequirement =
    event.value?.registration?.requirements?.programmes?.includes(
      useAuth.user?.studyProgram
    ) ?? true

  const meetsYearRequirement =
    event.value?.registration?.requirements?.years?.includes(
      useAuth.user?.currentYear
    ) ?? true

  // check if user is already registered for event
  const alreadyRegistered = computed(
    () =>
      hasAttendants.value &&
      Object.values(event.value.attendants).includes(useAuth?.user?.uid)
  )

  // check if event is full
  const eventFull = computed(
    () =>
      hasCapacity.value &&
      hasAttendants.value &&
      Object.keys(event.value.attendants).length >= event.value.capacity
  )

  // does the event have any registration actions, and is user signed in
  const hasEventActions = computed(
    () => useAuth.isLoggedIn && hasCapacity.value
  )

  // check if registration actions should be rendered on client side
  const showRegistrationAction = ref(
    hasEventActions.value &&
      presentWithinTimeWindow(
        event.value.registration.start,
        event.value.registration.end
      )
  )

  // check if registration is open with interval if user is signed in and the event has a capacity
  let registrationOpenInterval: ReturnType<typeof setInterval>
  onMounted(() => {
    if (hasEventActions.value)
      registrationOpenInterval = setInterval(
        () =>
          (showRegistrationAction.value = presentWithinTimeWindow(
            event.value.registration.start,
            event.value.registration.end
          )),
        1000
      )
  })

  // clear interval when unmounting the component
  onBeforeUnmount(() => clearInterval(registrationOpenInterval))

  // check if user is already registered for event
  const showSignupButton = computed(
    () => hasCapacity.value && !alreadyRegistered.value
  )

  // alert state
  const initialAlertState = {
    show: false,
    alertRoute: '',
    type: undefined as AlertType,
  }

  const alertState = reactive({
    ...initialAlertState,
  })

  // Show appropriate success alert after signing up for event
  const displaySuccessAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'success'
    alertState.show = true
  }

  // Show appropriate error alert for failed API calls
  const displayErrorAlertFromMessage = (errorMessage: string) => {
    const content = getAlertContent('Error', errorMessage)
    alertState.alertRoute = content.alertRoute
    alertState.type = content.type
    alertState.show = content.show

    console.error(errorMessage)
  }

  // sign up for event
  const signUpForEvent = () => {
    $fetch('/api/event/register', {
      method: 'POST',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() => displaySuccessAlert('alert.success.event.register.sign_up'))
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }

  // opt out of event
  const optOutOfEvent = () => {
    $fetch('/api/event/register', {
      method: 'DELETE',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() => displaySuccessAlert('alert.success.event.register.opt_out'))
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }
</script>

<template>
  <VContainer class="container">
    <!-- Vuetify alert component -->
    <!-- TODO: #121 Make a custom reactive component for VSnackbar that takes in content prop -->
    <VSnackbar v-model="alertState.show">
      {{ $t(`${alertState.alertRoute}`) }}

      <template #actions>
        <VBtn
          :color="alertState.type"
          variant="text"
          @click="alertState.show = false"
        >
          {{ $t('alert.close_alert') }}
        </VBtn>
      </template>
    </VSnackbar>

    <!-- company logo -->
    <VCard
      class="d-flex justify-center align-center pa-4 image-container"
      flat
      rounded="lg"
    >
      <NuxtImg
        class="image"
        fit="contain"
        :src="company?.logo || 'images/logo_long.png'"
      />
    </VCard>

    <!-- event description -->
    <VCard class="description elevation-4" rounded="lg">
      <VCardTitle class="title">{{ event?.title }}</VCardTitle>
      <VCardText class="text">{{ event?.description }}</VCardText>
    </VCard>

    <!-- event details -->
    <VCard class="details elevation-4" rounded="lg">
      <!-- edit event -->
      <VBtn
        v-if="useAuth.hasAccess(['admin'])"
        class="edit-event"
        variant="text"
        icon="mdi-pencil"
        size="small"
        color="primary"
        @click="() => navigateTo(localePath(`/event/edit/${event.uid}`))"
      />

      <VCardTitle class="details__title">
        {{ $t('event.page.details.name') }}
      </VCardTitle>

      <VCardText class="details__from pt-2 pb-0">
        <strong>{{ $t('event.page.details.from') }}:</strong>
        {{ eventStartString }}
      </VCardText>

      <VCardText class="details__to py-0 pb-5">
        <strong>{{ $t('event.page.details.to') }}:</strong>
        {{ eventEndString }}
      </VCardText>

      <VCardText
        v-if="registrationStartString"
        class="details__from py-0 pb-0 d-flex flex-wrap"
      >
        <strong class="mr-2">{{ $t('event.page.details.reg_start') }}: </strong>
        <span>{{ registrationStartString }}</span>
      </VCardText>

      <VCardText
        v-if="registrationEndString"
        class="details__to py-0 pb-5 d-flex flex-wrap"
      >
        <strong class="mr-2">{{ $t('event.page.details.reg_end') }}: </strong>
        <span>{{ registrationEndString }}</span>
      </VCardText>

      <VCardText class="details__location py-0 pb-5">
        <strong>{{ $t('event.page.details.location') }}: </strong>
        <NuxtLink
          v-if="event.location.map"
          :to="event.location.map"
          class="link"
          target="_blank"
          @click.stop
        >
          {{ event.location.name }}
          <VIcon size="x-small" color="primary">mdi-open-in-new</VIcon>
        </NuxtLink>
        <span v-else>
          {{ event.location.name }}
        </span>
      </VCardText>

      <VCardText class="details__host py-0 pb-5">
        <strong>{{ $t('event.page.details.host') }}: </strong>
        <NuxtLink v-if="company" :to="company?.webpage" target="_blank">
          {{ company?.name }}
          <VIcon size="xsmall" color="primary">mdi-open-in-new</VIcon>
        </NuxtLink>

        <span v-else>{{ 'E&T-dagene' }}</span>
      </VCardText>
    </VCard>

    <!-- event registration -->
    <div class="attendant-container">
      <VCard class="attendants elevation-4" color="primary" rounded="lg">
        <VCardTitle class="attendants__title">
          {{ $t('event.page.attendants.name') }}
        </VCardTitle>

        <VCardText
          v-if="hasCapacity"
          class="attendants__count d-flex justify-space-between flex-wrap"
        >
          <span>
            <strong>{{ $t('event.page.attendants.attendants') }}: </strong>

            <span v-if="hasAttendants">
              {{ Object.values(event.attendants).length }}
            </span>
            <span v-else>0</span>

            {{ event.capacity ? `/ ${event.capacity}` : '' }}
          </span>

          <span v-if="alreadyRegistered">
            {{ $t('event.page.attendants.registered') }}
            <VIcon style="margin-bottom: 2px">mdi-check-circle</VIcon>
          </span>
        </VCardText>

        <VCardText v-else>
          {{ $t('event.page.attendants.nocapacity') }}
        </VCardText>

        <VCardText
          v-if="hasYearsRequirements"
          class="reg__year py-0 pb-5 d-flex flex-wrap"
        >
          <strong class="mr-2"
            >{{ $t('event.page.details.reg_year') }}:
          </strong>
          <span
            v-for="year in hasYearsRequirements"
            :key="year"
            class="comma-separated"
            >{{ year }}</span
          >
        </VCardText>

        <VCardText
          v-if="programmeRequirements"
          class="reg__programme py-0 pb-5 d-flex flex-wrap flex-column"
        >
          <strong class="mr-2"
            >{{ $t('event.page.details.reg_programme') }}:
          </strong>
          <VDivider />
          <ul class="ml-6 mt-2">
            <li
              v-for="programme in programmeRequirements"
              :key="programme"
              class="py-1 px-2"
            >
              {{ programme }}
            </li>
          </ul>
        </VCardText>
      </VCard>

      <!-- Event actions: Sign up perform action -->
      <div
        v-if="!useAuth.isLoggedIn && hasCapacity && !eventFull"
        class="text-primary px-4 py-2 d-flex justify-center align-center"
      >
        <VIcon class="pr-3 pb-1">mdi-lock</VIcon>
        {{ $t('program.event.sign_in_to_register') }}
      </div>

      <div
        v-if="hasEventActions && !showRegistrationAction"
        class="text-primary px-4 py-2 d-flex justify-center align-center"
      >
        <VIcon class="pr-3">mdi-calendar-clock</VIcon>
        {{ $t('program.event.registration_closed') }}
      </div>

      <!-- sign up options -->
      <div v-if="hasEventActions && showRegistrationAction">
        <!-- sign up -->
        <VBtn
          v-if="showSignupButton"
          color="success"
          block
          variant="flat"
          :ripple="true"
          density="comfortable"
          :disabled="
            eventFull || !meetsProgrammeRequirement || !meetsYearRequirement
          "
          @click.stop="signUpForEvent"
        >
          {{ $t('program.event.sign_up') }}
        </VBtn>

        <!-- opt out -->
        <VBtn
          v-if="alreadyRegistered"
          color="primary"
          block
          variant="tonal"
          :ripple="true"
          density="comfortable"
          @click.stop="optOutOfEvent"
        >
          {{ $t('program.event.opt_out') }}
        </VBtn>
      </div>
    </div>
  </VContainer>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';
  .comma-separated {
    &::after {
      content: ',\00a0';
    }
    &:last-child::after {
      content: '' !important;
    }
  }
  .container {
    display: grid;
    width: 100vw;
    grid-template-columns: 1.1fr 3fr;
    gap: 1rem;
    grid-template-areas: 'details image' 'attendants description';

    .image-container {
      max-height: 300px;

      .image {
        width: 100%;
      }
    }

    .description {
      grid-area: description;
    }
    .details {
      grid-area: details;

      .edit-event {
        position: absolute;
        right: 0.5rem;
        top: 0.5rem;
      }
    }

    .attendant-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .attendants {
      grid-area: attendants;
    }

    @media #{map-get(settings.$display-breakpoints, 'lg-and-up')} {
      max-width: 1080px;
    }

    @media #{map-get(settings.$display-breakpoints, 'md-and-down')} {
      max-width: 750px;
      grid-template-areas: 'image' 'details' 'attendants' 'description';
      grid-template-columns: 1fr;
    }

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      max-width: 420px;
    }
  }
</style>
