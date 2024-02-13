<script setup lang="ts">
  const props = defineProps({
    jobUid: {
      type: String,
      required: false,
      default: null,
    },
  })
  // Fetch job data if props are provided
  const auth = useAuthStore()
  const { hasAccess, user } = storeToRefs(auth)

  // fetch job data
  const { data: job } = await useFetch('/api/job', {
    method: 'GET',
    query: {
      jobUID: props.jobUid,
    },
  })

  // fetch company data
  const { data: companies } = await useFetch('/api/company', {
    method: 'GET',
  })

  const localePath = useLocalePath()

  // redirect on non existing job or lacking access
  if (
    (props.jobUid && !job.value) ||
    (hasAccess.value(['company']) &&
      props.jobUid &&
      Object.values(job.value)[0].companyUID !== user.value?.companyUID)
  )
    navigateTo(localePath('/jobs/edit'))

  const initialState = {
    companyUID: null,
    deadline: null,
    description: null,
    jobType: null,
    location: null,
    title: null,
    applicationLink: '',
    uid: null,
  }

  // Set state to job data if data fetched successfully
  const state = reactive(
    props.jobUid && job.value
      ? { ...Object.values(embedKeyIntoObjectValues(job.value))[0] }
      : { ...initialState }
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

  // Show appropriate success alert after signing up for job
  const displaySuccessAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'success'
    alertState.show = true
  }

  // show appropriate error alert after signing up for job
  const displayErrorAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'error'
    alertState.show = true
  }

  // Show appropriate error alert for failed API calls
  const displayErrorAlertFromMessage = (errorMessage: string) => {
    const content = getAlertContent(errorMessage, 'Job')
    alertState.alertRoute = content.alertRoute
    alertState.type = content.type
    alertState.show = content.show
  }

  const form = ref()

  // Boolean control states
  const editMode = computed(() => !!state.uid || !!state.jobUID)

  // get company select options
  const companyList = computed(() => {
    if (!hasAccess.value(['admin', 'company']) || !job) return null

    if (hasAccess.value(['admin'])) {
      return embedKeyIntoObjectValues(companies.value).map((company) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uid, name, ...remains } = company
        return {
          value: uid,
          title: name,
        }
      })
    }

    if (hasAccess.value(['company'])) {
      return embedKeyIntoObjectValues(companies.value)
        .filter((company) => company.uid === user.value?.companyUID)
        .map((company) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { uid, name, ...remains } = company
          return {
            value: uid,
            title: name,
          }
        })
    }
  })

  // save changes to existing job
  const saveChanges = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    state.jobUID = state.uid

    // eslint-disable-next-line
    const { uid, ...rest } = state
    // update job
    await $fetch('/api/job', {
      method: 'PUT',
      body: rest,
    })
      .then(() => {
        displaySuccessAlert('alert.success.job.edit.modified')
        setTimeout(() => navigateTo(localePath('/admin/jobs')), 2000)
      })
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }

  const createCompany = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    // create job
    await $fetch('/api/job', {
      method: 'POST',
      body: state,
    })
      .then(() => {
        displaySuccessAlert('alert.success.job.edit.created')
        setTimeout(() => navigateTo(localePath('/admin/jobs')), 2000)
      })
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }
</script>

<template>
  <div class="mx-auto" style="max-width: 95vw">
    <!-- form header -->
    <h3 v-if="editMode" class="title py-6 mt-4">
      {{ $t('edit.jobs.edit.title') }}
    </h3>
    <h3 v-else class="title py-6 mt-4">
      {{ $t('edit.jobs.create.title') }}
    </h3>

    <!-- alert component -->
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

    <!-- edit form -->
    <VForm ref="form" @submit.prevent="saveChanges || createCompany">
      <VContainer>
        <!-- job title -->
        <VRow>
          <FormTextInput
            v-model="state.title"
            :content="{
              label: $t('edit.jobs.attributes.title'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- job description -->
        <VRow>
          <FormTextareaInput
            v-model="state.description"
            :content="{
              label: $t('edit.jobs.attributes.description'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- job owner company -->
        <VRow>
          <FormSelectInput
            v-model="state.companyUID"
            :content="{
              label: $t('edit.jobs.attributes.company'),
              options: companyList,
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- job type -->
        <VRow>
          <FormSelectInput
            v-model="state.jobType"
            :content="{
              label: $t('edit.jobs.attributes.jobtype.name'),
              options: [
                {
                  title: $t('edit.jobs.attributes.jobtype.full_time'),
                  value: 'full-time',
                },
                {
                  title: $t('edit.jobs.attributes.jobtype.graduate'),
                  value: 'graduate',
                },
                {
                  title: $t('edit.jobs.attributes.jobtype.summer_internship'),
                  value: 'summer-internship',
                },
              ],
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- job location -->
        <VRow>
          <FormTextInput
            v-model="state.location"
            :content="{
              label: $t('edit.jobs.attributes.location'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- job application link-->
        <VRow>
          <FormTextInput
            v-model="state.applicationLink"
            :content="{
              label: $t('edit.jobs.attributes.application_link'),
            }"
            hint="Leave empty for no link"
          />
        </VRow>

        <!-- job deadline -->
        <VRow>
          <FormDateTimeInput
            v-model="state.deadline"
            type="date"
            :content="{
              label: $t('edit.jobs.attributes.deadline') + ' (YYYY-MM-DD)',
            }"
            :rules="[useRequiredInput]"
          />
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
              @click="navigateTo(localePath('/admin/jobs'))"
            >
              {{ $t('edit.jobs.cancel') }}
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
              {{ $t('edit.jobs.edit.action') }}
            </VBtn>
            <VBtn
              v-if="!editMode"
              block
              variant="flat"
              color="success"
              @click="createCompany"
            >
              {{ $t('edit.jobs.create.action') }}
            </VBtn>
          </VCol>
        </VRow>
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
