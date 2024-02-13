<script setup lang="ts">
  import {
    useRequiredInput,
    useValidateEmail,
    useValidatePassword,
    useRequireEqualPasswords,
  } from '@/composables/useForm'
  import { dietaryFlags } from '~/config/app.config'

  const { data: studyProgrammes } = await useFetch('/api/programme')

  // alphabetically sort study programmes
  const programmeOptions = computed(() =>
    Object.values(studyProgrammes.value)
      .map((prog: any) => prog.name)
      .sort((a, b) => a.localeCompare(b))
  )

  // get year options based on study programme
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

  // sort dietary restrictions alphabetically
  const dietaryOptions = computed(() => {
    const nuxtApp = useNuxtApp()
    return dietaryFlags
      .map((flag) => {
        return {
          title: nuxtApp.$i18n.t(`dietary_restrictions.${flag.name}`),
          value: flag.name,
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  })

  const initialState = {
    name: '',
    email: '',
    password: '',
    passwordConfirmation: null,
    studyProgram: '',
    currentYear: '',
    userType: null,
    registrationCode: null,
    dietaryRestrictions: null as string[] | null,
  }

  const state = reactive({
    ...initialState,
  })

  // Reset currentYear if programme doesn't have that year
  watch(
    () => state.studyProgram,
    (program) => {
      if (!yearOptions.value(program).includes(Number(state.currentYear)))
        state.currentYear = ''
    }
  )

  const form = ref()
  const hasDietaryRestrictions = ref(false)
  const otherRestrictions = ref<null | string>(null)
  const isRegistering = ref<boolean>(false)
  const submit = async () => {
    if (!form.value) return

    const { valid } = await form.value.validate()
    if (!valid) throw new Error('Form is not valid')

    // add other restrictions if submitted
    if (otherRestrictions.value && otherRestrictions.value !== '') {
      otherRestrictions?.value
        .split(',')
        .map((restriction) => state.dietaryRestrictions?.push(restriction))
    }

    isRegistering.value = true

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordConfirmation, userType, ...user } = state

    await registerUser(
      {
        name: user.name,
        email: user.email,
        password: user.password,
        dietaryRestrictions: user.dietaryRestrictions,
        studyProgram: userType === 'student' ? user.studyProgram : undefined,
        currentYear:
          userType === 'student' ? Number(user.currentYear) : undefined,
      },
      user.registrationCode ?? undefined // Only send registration code if user is a company
    )
      .catch((error) => {
        const content = getAlertRouteAndType(error.message)

        alertState.alertRoute = content.route
        alertState.type = content.type as AlertType
        alertState.show = true

        console.error(error)
      })
      .finally(() => {
        isRegistering.value = false
      })
  }

  const initialAlertState = {
    show: false,
    alertRoute: '',
    type: undefined as AlertType,
  }

  const alertState = reactive({
    ...initialAlertState,
  })
</script>

<template>
  <VSnackbar v-model="alertState.show">
    {{ $t(`${alertState.alertRoute}`) }}

    <template #actions>
      <v-btn
        :color="alertState.type"
        variant="text"
        @click="alertState.show = false"
      >
        {{ $t('alert.close_alert') }}
      </v-btn>
    </template>
  </VSnackbar>
  <VForm ref="form" @submit.prevent="submit">
    <VContainer>
      <VRow>
        <FormTextInput
          v-model="state.name"
          :content="{
            label: $t('user.register.full_name'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>
      <VRow>
        <FormEmailInput
          v-model="state.email"
          :rules="[useRequiredInput, useValidateEmail]"
        />
      </VRow>
      <VRow>
        <FormPasswordInput
          v-model="state.password"
          :rules="[useRequiredInput, useValidatePassword]"
        />
      </VRow>
      <VRow>
        <FormPasswordInput
          v-model="state.passwordConfirmation"
          :rules="[
            useRequiredInput,
            useRequireEqualPasswords(
              state.password,
              state.passwordConfirmation
            ),
          ]"
          confirm-password
        />
      </VRow>
      <VRow>
        <VRadioGroup
          v-model="hasDietaryRestrictions"
          :label="$t('user.register.dietary_restrictions.name')"
        >
          <VRadio
            :label="$t('user.register.dietary_restrictions.norestrictions')"
            :value="false"
          ></VRadio>
          <VRadio
            :label="$t('user.register.dietary_restrictions.restrictions')"
            :value="true"
          ></VRadio>
        </VRadioGroup>
      </VRow>
      <VRow v-if="hasDietaryRestrictions">
        <FormSelectInput
          v-model="state.dietaryRestrictions"
          multiple
          :content="{
            label: $t('user.register.dietary_restrictions.name'),
            options: dietaryOptions,
          }"
          :rules="[
            hasDietaryRestrictions && !otherRestrictions
              ? useRequiredInput
              : null,
          ]"
        />
      </VRow>
      <VRow v-if="hasDietaryRestrictions" class="mt-3 pt-0">
        <FormTextInput
          v-model="otherRestrictions"
          :content="{
            label: $t('user.register.dietary_restrictions.other'),
          }"
        />
      </VRow>
    </VContainer>
    <VContainer class="px-0">
      <VTabs v-model="state.userType" fixed-tabs color="primary" class="tabs">
        <VTab value="student">{{ $t('user.register.user_type.student') }}</VTab>
        <VTab value="company">{{ $t('user.register.user_type.company') }}</VTab>
      </VTabs>
      <VCardText class="px-0">
        <VWindow v-model="state.userType">
          <VWindowItem value="student">
            <FormSelectInput
              v-model="state.studyProgram"
              :content="{
                label: $t('user.register.study_program'),
                // eslint-disable-next-line vue/max-len
                options: programmeOptions,
              }"
              :rules="[state.userType === 'student' ? useRequiredInput : null]"
            />
            <FormSelectInput
              v-model="state.currentYear"
              :content="{
                label: $t('user.register.year'),
                options: yearOptions(state.studyProgram),
              }"
              :rules="[state.userType === 'student' ? useRequiredInput : null]"
            />
          </VWindowItem>

          <VWindowItem value="company">
            <FormTextInput
              v-model="state.registrationCode"
              :content="{
                label: $t('user.register.registration_code'),
                hint: $t('user.register.code_hint'),
              }"
              :rules="[state.userType === 'company' ? useRequiredInput : null]"
            />
          </VWindowItem>
        </VWindow>
      </VCardText>
      <VBtn
        color="success"
        type="submit"
        class="btn--submit"
        :loading="isRegistering"
      >
        {{ $t('user.sign_up') }}
      </VBtn>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';

  .v-container {
    max-width: 26rem !important;
  }

  .v-row {
    padding-block: 0.6rem;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .v-window__container {
    div {
      padding-block: 0.6rem;
    }
  }

  .btn--submit {
    width: 60%;
    margin-inline: 20% !important;
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    .v-tab {
      font-size: 1rem;
    }

    .btn--submit {
      width: 100%;
      margin: 0 !important;
    }
  }
</style>
