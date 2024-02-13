<script setup lang="ts">
  const props = defineProps({
    companyUid: {
      type: String,
      required: false,
      default: null,
    },
  })
  // Fetch company data if props are provided
  const auth = useAuthStore()
  const { hasAccess, user } = storeToRefs(auth)

  // fetch company data
  const { data: company } = await useFetch('/api/company', {
    method: 'GET',
    query: {
      companyUID: props.companyUid,
    },
  })

  const localePath = useLocalePath()
  // redirect on non existing company or lacking access
  if (
    (props.companyUid && !company.value) ||
    (hasAccess.value(['company']) &&
      props.companyUid &&
      props.companyUid !== user.value?.companyUID)
  )
    navigateTo(localePath('/company/edit'))

  const initialState = {
    name: null,
    description: null,
    type: null,
    webpage: null,
    logo: null,
    uid: null,
  }

  // Set state to company data if data fetched successfully
  const state = reactive(
    props.companyUid && company.value
      ? { ...Object.values(embedKeyIntoObjectValues(company.value))[0] }
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

  // Show appropriate success alert after signing up for company
  const displaySuccessAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'success'
    alertState.show = true
  }

  // show appropriate error alert after signing up for company
  const displayErrorAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'error'
    alertState.show = true
  }

  // Show appropriate error alert for failed API calls
  const displayErrorAlertFromMessage = (errorMessage: string) => {
    const content = getAlertContent(errorMessage)
    alertState.alertRoute = content.alertRoute
    alertState.type = content.type
    alertState.show = content.show
  }

  const form = ref()
  const file = ref()

  // Boolean control states
  const editMode = computed(() => !!state.uid || !!state.companyUID)

  // update ref on input change
  const setLogo = (event) => {
    file.value = event.target.files[0]
  }

  // update logo
  const updateLogo = async () => {
    if (!file.value || !state.uid) return

    // creating multipart form data
    const formData = new FormData()
    formData.append('file', file.value)
    formData.append('storagePath', `companies/${state.uid}`)

    // posting image to storage bucket
    await $fetch('/api/image', {
      method: 'POST',
      body: formData,
    })
      .then(({ URL }) => {
        state.logo = URL
      })
      .catch(() => displayErrorAlert('alert.error.company.edit.modified'))
  }

  // save changes to existing company
  const saveChanges = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    state.companyUID = state.uid

    await updateLogo()

    // eslint-disable-next-line
    const { uid, ...rest } = state
    // update company
    await $fetch('/api/company', {
      method: 'PUT',
      body: rest,
    })
      .then(() => {
        displaySuccessAlert('alert.success.company.edit.modified')
        setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
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

    // create company
    await $fetch('/api/company', {
      method: 'POST',
      body: state,
    })
      .then(async (res) => {
        // get companuUID from server response
        state.uid = res.companyUID

        // update logo
        await updateLogo()

        // update company logo with UID
        // eslint-disable-next-line
        const { uid, logo, ...rest } = state
        await $fetch('/api/company', {
          method: 'PUT',
          body: { companyUID: uid, logo },
        })
      }) // add logo newly created company if provided
      .then(() => {
        displaySuccessAlert('alert.success.company.edit.created')
        setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
      })
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }
</script>

<template>
  <div class="mx-auto" style="max-width: 95vw">
    <!-- Header -->
    <h3 v-if="editMode" class="title py-6 mt-4">
      {{ $t('edit.company.edit.title') }}
    </h3>
    <h3 v-else class="title py-6 mt-4">
      {{ $t('edit.company.create.title') }}
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
    <VForm ref="form" @submit.prevent="saveChanges || createCompany">
      <VContainer>
        <!-- Name -->
        <VRow>
          <FormTextInput
            v-model="state.name"
            :content="{
              label: $t('edit.company.attributes.name'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- Description -->
        <VRow>
          <FormTextareaInput
            v-model="state.description"
            :content="{
              label: $t('edit.company.attributes.description'),
            }"
          />
        </VRow>

        <!-- Company Type -->
        <VRow>
          <FormSelectInput
            v-model="state.type"
            :content="{
              label: $t('edit.company.attributes.type.name'),
              options: [
                {
                  title: $t('edit.company.attributes.type.main_partner'),
                  value: 'main-partner',
                },
                {
                  title: $t('edit.company.attributes.type.partner'),
                  value: 'partner',
                },
                {
                  title: $t('edit.company.attributes.type.sponsor'),
                  value: 'sponsor',
                },
              ],
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- Webpage -->
        <VRow>
          <FormTextInput
            v-model="state.webpage"
            :content="{
              label: $t('edit.company.attributes.webpage'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- Logo -->
        <!-- TODO: #190 Add code for uploading image after company creation -->
        <VRow style="overflow: scroll">
          <VCol :cols="state.logo ? 9 : 12">
            <FormFileInput
              :content="{
                label: state.logo
                  ? `${state.logo.split('/').pop()}`
                  : $t('edit.company.attributes.logo'),
                icon: 'mdi-image',
                accept: ['image/png', 'image/jpeg'],
              }"
              :rules="[useRequiredInput]"
              clearable
              @change="setLogo"
            />
          </VCol>
          <VCol v-if="state.logo && user?.userType === 'admin'" cols="3">
            <VBtn
              variant="outlined"
              block
              height="56"
              color="warning"
              style="min-width: fit-content"
              @click="state.logo = null"
            >
              {{ $t('edit.company.unlink_logo') }}
            </VBtn>
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
              @click="navigateTo(localePath('/admin/companies'))"
            >
              {{ $t('edit.company.cancel') }}
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
              {{ $t('edit.company.edit.action') }}
            </VBtn>
            <VBtn
              v-if="!editMode"
              block
              variant="flat"
              color="success"
              @click="createCompany"
            >
              {{ $t('edit.company.create.action') }}
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
