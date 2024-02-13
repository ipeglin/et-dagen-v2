<script setup lang="ts">
  const localePath = useLocalePath()

  const props = defineProps({
    eventUid: {
      type: String,
      required: false,
      default: null,
    },
  })

  // Fetch event data if props are provided
  const { data: event } = await useAsyncData('event', async () => {
    if (!props.eventUid) return

    const data = await $fetch('/api/event', {
      query: { eventUID: props.eventUid },
    })

    // allows adding capacity and registration start and end to an existing event
    if (!Object.hasOwn(data[props.eventUid], 'registration'))
      data[props.eventUid].registration = { start: null, end: null }

    return data
  })

  const { hasAccess, user } = useAuthStore()
  // Reroute to /event/edit if event does not exist
  // or if user does not have access to edit event
  if (
    (props.eventUid && !event.value) ||
    (hasAccess(['company']) &&
      props.eventUid &&
      event.value[props.eventUid]?.companyUID !== user?.companyUID)
  )
    navigateTo(localePath('/event/edit'))

  const { data: studyProgrammes } = await useFetch('/api/programme')

  // alphabetically sort study programmes
  const programmeOptions = computed(() =>
    Object.values(studyProgrammes.value)
      .map((prog: any) => prog.name)
      .sort((a, b) => a.localeCompare(b))
  )

  // Fetch all users
  // TODO: #188 Replace with API endpoint for getting only a sublist of known UIDs
  const { data: users } = await useFetch('/api/user', {
    query: { scope: 'all' },
  })
  const attendantList = computed(() => Object.entries(state.attendants))

  // Get user name by UID
  const getUserNameByUid = computed(() => (uid: string) => {
    return (
      users.value.find((user: any) => user.uid === uid)?.name ??
      'User not found'
    )
  })

  const { data: companies } = await useFetch('/api/company')
  // Format companies for select input
  const companyList = computed(() => {
    if (!hasAccess(['admin', 'company']) || !event) return null

    if (hasAccess(['admin'])) {
      const list = embedKeyIntoObjectValues(companies.value).map((company) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uid, name, ...remains } = company
        return {
          value: uid,
          title: name,
        }
      })

      // Add E&T-dagene as an option
      list.push({
        value: 'etdagene',
        title: 'E&T-dagene',
      })

      return list
    }

    if (hasAccess(['company'])) {
      return Object?.values(
        embedKeyIntoObjectValues(companies.value)
          .filter(({ uid }) => uid === user?.companyUID)
          .map((company) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { uid, name, ...remains } = company
            return {
              value: uid,
              title: name,
            }
          })
      )
    }
  })

  // Initial state in case of missing props or API bounce
  const initialState = {
    title: null,
    description: null,
    location: {
      name: null,
      map: null,
    },
    date: {
      start: null,
      end: null,
    },
    capacity: null,
    companyUID: null,
    attendants: null,
    uid: null,
    registration: {
      start: null,
      end: null,
      requirements: {
        programmes: null,
        years: null,
      },
    },
  }

  // Set state to event data if data fetched successfully
  const state = reactive(
    event.value
      ? { ...Object.values(embedKeyIntoObjectValues(event.value))[0] }
      : { ...initialState }
  )

  const selectedProgrammes = ref(
    state?.registration?.requirements?.programmes || []
  )
  const selectedYears = ref(state?.registration?.requirements?.years || [])
  const limitRegistration = ref(
    state?.capacity &&
      (selectedProgrammes.value.length > 0 || selectedYears.value.length > 0)
  )

  // Alert state
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

  const displayErrorAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'error'
    alertState.show = true
  }

  // Show appropriate error alert for failed API calls
  const displayErrorAlertFromMessage = (
    errorType: string,
    errorMessage: string
  ) => {
    const content = getAlertContent(errorType, errorMessage)
    alertState.alertRoute = content.alertRoute
    alertState.type = content.type
    alertState.show = content.show
  }

  const form = ref()

  // Boolean control states
  const editMode = computed(() => !!state.uid || !!state.eventUID)
  const isLoadingAttendants = ref(false)

  // Get updated event attendants
  const refreshAttendants = async () => {
    isLoadingAttendants.value = true
    const data = await $fetch('/api/event', {
      query: { eventUID: props.eventUid || state.uid },
    })
    if (!data) return

    // Only retain attendants
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { attendants, ...remains } = Object.values(data)[0]
    state.attendants = attendants

    isLoadingAttendants.value = false
  }

  // TODO: #184 Add code for removing user from event

  const removeFromEvent = async (userUID: string) => {
    await $fetch('/api/event/register', {
      method: 'DELETE',
      body: {
        eventUID: props.eventUid || state.uid,
        userUID,
      },
    })

    // Code for removing user
    refreshAttendants()
  }

  const handleEmptyStateValues = () => {
    state.capacity =
      state.capacity === undefined || Number(state.capacity) === 0
        ? null
        : Number(state.capacity)

    state.eventUID = state.uid

    state.location.map = state.location.map ? state.location.map : null

    // set null registration datetime if capacity is null
    state.registration.start =
      state.capacity && state.registration.start
        ? state.registration.start
        : null

    state.registration.end =
      state.capacity && state.registration.end ? state.registration.end : null

    const hasProgrammeRequirement = selectedProgrammes.value.length > 0
    const hasYearsRequirement = selectedYears.value.length > 0
    if (
      state.capacity &&
      limitRegistration.value &&
      (hasProgrammeRequirement || hasYearsRequirement)
    ) {
      state.registration.requirements = {
        programmes: null,
        years: null,
      }

      if (hasProgrammeRequirement)
        state.registration.requirements.programmes = selectedProgrammes.value

      if (hasYearsRequirement)
        state.registration.requirements.years = selectedYears.value
    } else {
      state.registration.requirements = null
    }
  }

  const routeOnSuccess = () => {
    const route = hasAccess(['admin']) ? '/admin/events' : '/company/admin'
    return navigateTo(localePath(route))
  }

  const saveChanges = async () => {
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    handleEmptyStateValues()
    await $fetch('/api/event', {
      method: 'PUT',
      body: state,
    })
      .then(() => {
        // Handle successful response
        displaySuccessAlert('alert.success.event.edit.modified')
        setTimeout(routeOnSuccess, 2000)
      })
      .catch((error) => {
        // Handle errors, including HTTP errors
        displayErrorAlertFromMessage('Event', error.statusMessage)
      })
  }

  const createEvent = async () => {
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    handleEmptyStateValues()
    await $fetch('/api/event', {
      method: 'POST',
      body: state,
    })
      .then(() => {
        // Handle successful response
        displaySuccessAlert('alert.success.event.edit.created')
        setTimeout(routeOnSuccess, 2000)
      })
      .catch((error) => {
        // Handle errors, including HTTP errors
        displayErrorAlertFromMessage('Event', error.message)
      })
  }

  const signUpForEventUid = ref('')

  const signUpForEvent = () => {
    $fetch('/api/event/register', {
      method: 'POST',
      body: { eventUID: props.eventUid, userUID: signUpForEventUid.value },
    })
      .then(() => {
        refreshAttendants()
        signUpForEventUid.value = ''
      })
      .catch((error) =>
        displayErrorAlertFromMessage('Event', error.statusMessage)
      )
  }
</script>

<template>
  <div class="mx-auto" style="max-width: 95vw">
    <!-- Header -->
    <h3 v-if="editMode" class="title py-6 mt-4">
      {{ $t('edit.event.edit.title') }}
    </h3>
    <h3 v-else class="title py-6 mt-4">
      {{ $t('edit.event.create.title') }}
    </h3>

    <!-- Alert component -->
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

    <!-- Edit Form -->
    <VForm ref="form" @submit.prevent="saveChanges || createEvent">
      <VContainer>
        <!-- Title -->
        <VRow>
          <FormTextInput
            v-model="state.title"
            :content="{
              label: $t('edit.event.attributes.title'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- Description -->
        <VRow>
          <FormTextareaInput
            v-model="state.description"
            :content="{
              label: $t('edit.event.attributes.description'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- Company -->
        <VRow>
          <FormSelectInput
            v-model="state.companyUID"
            :content="{
              label: $t('edit.event.attributes.company'),
              options: companyList,
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- Capacity -->
        <VRow>
          <FormNumberInput
            v-model="state.capacity"
            :content="{
              label: $t('edit.event.attributes.capacity'),
            }"
            clearable
          />
        </VRow>

        <VSwitch
          v-if="state.capacity"
          v-model="limitRegistration"
          :label="$t('edit.event.attributes.registration.limit')"
          class="mt-4"
        />

        <VRow v-if="limitRegistration">
          <FormSelectInput
            v-model="selectedProgrammes"
            :content="{
              label: $t(
                'edit.event.attributes.registration.requirements.programmes'
              ),
              options: programmeOptions,
            }"
            clearable
            multiple
          />
        </VRow>

        <VRow v-if="limitRegistration">
          <FormSelectInput
            v-model="selectedYears"
            :content="{
              label: $t(
                'edit.event.attributes.registration.requirements.years'
              ),
              options: [1, 2, 3, 4, 5],
            }"
            clearable
            multiple
          />
        </VRow>

        <VRow v-if="state.capacity">
          <VCol>
            <FormDateTimeInput
              v-model="state.registration.start"
              :content="{
                label: $t('edit.event.attributes.registration.start'),
              }"
              :rules="[state.capacity ? useRequiredInput : null]"
            />
          </VCol>
          <VCol>
            <FormDateTimeInput
              v-model="state.registration.end"
              :content="{
                label: $t('edit.event.attributes.registration.end'),
              }"
              :rules="[state.capacity ? useRequiredInput : null]"
            />
          </VCol>
        </VRow>

        <!-- Datetime -->
        <VRow>
          <VCol>
            <FormDateTimeInput
              v-model="state.date.start"
              :content="{
                label: $t('edit.event.attributes.date.start'),
              }"
              :rules="[useRequiredInput]"
            />
          </VCol>
          <VCol>
            <FormDateTimeInput
              v-model="state.date.end"
              :content="{
                label: $t('edit.event.attributes.date.end'),
              }"
              :rules="[useRequiredInput]"
            />
          </VCol>
        </VRow>

        <!-- Location -->
        <VRow>
          <VCol>
            <FormTextInput
              v-model="state.location.name"
              :content="{
                label: $t('edit.event.attributes.location.name'),
              }"
              :rules="[useRequiredInput]"
            />
          </VCol>
          <VCol>
            <FormTextInput
              v-model="state.location.map"
              :content="{
                label: $t('edit.event.attributes.location.map'),
              }"
            />
          </VCol>
        </VRow>
      </VContainer>

      <!-- Actions -->
      <VContainer>
        <VRow justify="center">
          <VCol cols="6">
            <VBtn
              block
              variant="outlined"
              color="error"
              @click="$router.back()"
            >
              {{ $t('edit.event.cancel') }}
            </VBtn>
          </VCol>
          <VCol cols="6">
            <VBtn
              v-if="editMode"
              block
              variant="flat"
              color="success"
              @click="saveChanges"
            >
              {{ $t('edit.event.edit.action') }}
            </VBtn>
            <VBtn
              v-if="!editMode"
              block
              variant="flat"
              color="success"
              @click="createEvent"
            >
              {{ $t('edit.event.create.action') }}
            </VBtn>
          </VCol>
        </VRow>
      </VContainer>

      <!-- Edit Attandant -->
      <VContainer v-if="editMode && state?.capacity">
        <VCard class="mx-auto" max-width="800">
          <VCardTitle class="d-flex align-center flex-wrap">
            {{ $t('edit.event.attributes.attendants') }}
            <VBtn
              icon="mdi-refresh"
              size="small"
              variant="plain"
              color="primary"
              :loading="isLoadingAttendants"
              @click="refreshAttendants"
            />
            <VSpacer />

            <!-- sign up user for event -->
            <FormTextInput
              v-model="signUpForEventUid"
              hide-details
              density="compact"
              class="mr-2"
              :content="{
                label: $t('edit.event.attributes.user_id'),
              }"
            />
            <VBtn density="compact" color="success" @click="signUpForEvent">
              {{ $t('edit.event.attributes.sign_up') }}
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VVirtualScroll
            v-if="state?.attendants"
            :items="attendantList"
            height="320"
            item-height="48"
          >
            <template #default="{ item }">
              <VListItem
                :title="`${getUserNameByUid(item[1])}`"
                :subtitle="`UID: ${item[0]}`"
              >
                <template #prepend>
                  <VIcon class="bg-primary">mdi-account</VIcon>
                </template>

                <template #append>
                  <VBtn
                    icon="mdi-delete"
                    size="x-small"
                    variant="tonal"
                    color="error"
                    @click="removeFromEvent(item[1])"
                  ></VBtn>
                </template>
              </VListItem>
            </template>
          </VVirtualScroll>
        </VCard>
      </VContainer>
    </VForm>
  </div>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';

  .title {
    text-align: center;
  }

  .v-container {
    max-width: 50rem !important;
  }

  .v-row {
    padding-block: 0.6rem;
  }
</style>
