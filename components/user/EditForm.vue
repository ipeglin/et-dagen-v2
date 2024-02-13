<script setup lang="ts">
  import type { User } from '../../models/User'

  const props = defineProps({
    user: {
      type: Object as PropType<User>,
      required: true,
    },
  })

  const router = useRouter()
  // get study programmes
  const { data: studyProgrammes } = await useFetch('/api/programme')
  const programmeList = computed(() =>
    studyProgrammes.value.map((prog: any) => prog.name).sort()
  )
  const yearOptions = computed(() => {
    return (studyProgram: string) => {
      const programme = studyProgrammes.value.find(
        (prog: any) => prog.name === studyProgram
      )

      if (!programme || programme.type === 'integrated') return [1, 2, 3, 4, 5]

      switch (programme.type) {
        case 'bachelor':
          return [1, 2, 3]
        case 'master':
          return [4, 5]
        default:
          return []
      }
    }
  })

  // get companies
  const { data: companies } = await useFetch('/api/company')
  const companyList = computed(() => {
    return embedKeyIntoObjectValues(companies.value).map((company) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uid, name, ...remains } = company
      return {
        value: uid,
        title: name,
      }
    })
  })

  // handle user privileges
  const auth = useAuthStore()
  const { hasAccess } = storeToRefs(auth)
  const isAdmin = computed(() => hasAccess.value(['admin']))

  // Set state to user data plus companyUID
  const state = reactive({ companyUID: null, ...props.user })

  // Reset currentYear if programme doesn't have that year
  watch(
    () => state.studyProgram,
    (program) => {
      if (!yearOptions.value(program).includes(Number(state.currentYear)))
        state.currentYear = ''
    }
  )

  // check if user has changed
  const hasChanged = computed(() => {
    return !compareObjects(state, { companyUID: null, ...props.user })
  })

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
  // const displaySuccessAlert = (alertRoute: string) => {
  //   alertState.alertRoute = alertRoute
  //   alertState.type = 'success'
  //   alertState.show = true
  // }

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

  // save changes to user
  const saveChanges = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    if (state.userType !== 'company') {
      state.companyUID = null
    }

    // update user
    await useAsyncData('update-user', async () => {
      await Promise.all([
        $fetch('/api/user', {
          method: 'POST',
          body: {
            ...state,
          },
        }),
        $fetch('/api/user', {
          method: 'PUT',
          body: {
            ...state,
          },
        }),
      ])
    })
      .then(async () => {
        useAlerts.alert(getI18nString('alert.success.user.edit'), 'success')

        if (state.uid === auth.user?.uid) {
          // sign out the new user
          await signoutUser()

          // navigate to sign in page
          const localePath = useLocalePath()
          await navigateTo({
            path: localePath('/user/signin'),
            query: {
              registered: 'true',
            },
          })
        } else {
          setTimeout(() => router.back(), 2000)
        }
      })
      .catch((error) => {
        console.error(error)
        displayErrorAlertFromMessage(error.message)
      })
  }
</script>

<template>
  <!-- Header -->
  <h4 class="text-sm-h3 text-h4 font-weight-bold text-center pt-16 pb-4">
    {{ $t('edit.user.title') }}
  </h4>

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
  <VForm ref="form" @submit.prevent="saveChanges">
    <VContainer>
      <!-- Name -->
      <VRow>
        <FormTextInput
          v-model="state.name"
          :content="{
            label: $t('edit.user.attributes.name'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- email -->
      <VRow>
        <FormEmailInput
          v-model="state.email"
          :content="{
            label: $t('edit.user.attributes.email'),
          }"
          :rules="[useRequiredInput, useValidateEmail]"
        />
      </VRow>

      <!-- user type -->
      <VRow v-if="isAdmin">
        <FormSelectInput
          v-model="state.userType"
          :content="{
            label: $t('edit.user.attributes.type.name'),
            options: [
              { title: $t('edit.user.attributes.type.admin'), value: 'admin' },
              {
                title: $t('edit.user.attributes.type.company'),
                value: 'company',
              },
              { title: $t('edit.user.attributes.type.basic'), value: 'basic' },
            ],
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- company affiliation -->
      <VRow v-if="isAdmin && state.userType === 'company'">
        <FormSelectInput
          v-model="state.companyUID"
          :content="{
            label: $t('edit.user.attributes.company'),
            options: companyList,
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- study programme -->
      <VRow v-if="isAdmin && state.userType !== 'company'">
        <FormSelectInput
          v-model="state.studyProgram"
          :content="{
            label: $t('edit.user.attributes.studyprogram'),
            options: programmeList,
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- current year -->
      <VRow v-if="isAdmin && state.userType !== 'company'">
        <FormSelectInput
          v-model="state.currentYear"
          :content="{
            label: $t('edit.user.attributes.currentyear'),
            options: yearOptions(state.studyProgram),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>
    </VContainer>

    <!-- Actions -->
    <VContainer>
      <VRow justify="center">
        <VCol cols="6">
          <VBtn block variant="outlined" color="error" @click="router.back()">
            {{ $t('edit.user.cancel') }}
          </VBtn>
        </VCol>
        <VCol cols="6">
          <VBtn
            block
            variant="flat"
            color="success"
            :disabled="!hasChanged"
            @click="saveChanges"
          >
            {{ $t('edit.user.save') }}
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';
  .title {
    text-align: center;
  }
  .v-container {
    max-width: 50rem;
  }
  .v-row {
    padding-block: 0.6rem;
  }
</style>
