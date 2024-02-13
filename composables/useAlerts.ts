const errorMessageMap = new Map([
  [
    'Firebase: Error (auth/email-already-in-use).',
    {
      source: 'firebase',
      type: 'error',
      message: 'email_in_use',
    },
  ],
  [
    'Invalid registration code',
    {
      source: 'server',
      type: 'error',
      message: 'invalid_registration_code',
    },
  ],
  [
    'Firebase: Error (auth/invalid-email).',
    {
      source: 'firebase',
      type: 'error',
      message: 'invalid_email',
    },
  ],
  [
    'Firebase: Error (auth/user-not-found).',
    {
      source: 'firebase',
      type: 'error',
      message: 'user_not_found',
    },
  ],
  [
    'Firebase: Error (auth/wrong-password).',
    {
      source: 'firebase',
      type: 'error',
      message: 'wrong_password',
    },
  ],
  [
    'Events: Error (register/event-is-full).',
    {
      source: 'event.register',
      type: 'error',
      message: 'event_is_full',
    },
  ],
  [
    'Events: Error (register/already-registered).',
    {
      source: 'event.register',
      type: 'error',
      message: 'already_registered',
    },
  ],
  [
    'Events: Error (event/event-doesnt-exists).',
    {
      source: 'event',
      type: 'error',
      message: 'event_doesnt_exist',
    },
  ],
  [
    'Events: Error (event/missing-event-id).',
    {
      source: 'event',
      type: 'error',
      message: 'missing_event_id',
    },
  ],
  [
    'Events: Error (register/user-not-registered).',
    {
      source: 'event.register',
      type: 'error',
      message: 'user_not_registered',
    },
  ],
  [
    'Events: Error (register/registration-unnecessary).',
    {
      source: 'event.register',
      type: 'error',
      message: 'registration_unnecessary',
    },
  ],
  [
    'Events: Error (register/non-admin-user).',
    {
      source: 'event.register',
      type: 'error',
      message: 'non_admin_user',
    },
  ],
  [
    'Events: Error (register/registration-closed).',
    {
      source: 'event.register',
      type: 'error',
      message: 'closed',
    },
  ],
  [
    'Event Error: start-time-has-to-be-before-end-time',
    {
      source: 'event.register',
      type: 'error',
      message: 'end_time_before_start_time',
    },
  ],
])

export type AlertType = 'error' | 'info' | 'success' | 'warning' | undefined
export const getAlertTypeFromErrorMessage = (errorMessage: string) => {
  return (errorMessageMap.get(errorMessage)?.type || 'error') as AlertType
} // will always return "error" as AlertType

export const mapErrorMessageToAlertInfo = (errorMessage: string) => {
  return errorMessageMap.get(errorMessage) || 'missing_error'
}

export const getI18nAlertRoute = (errorMessage: string) => {
  const alert = mapErrorMessageToAlertInfo(errorMessage)
  if (alert === 'missing_error') return 'alert.error.default'

  const { source, type, message } = alert
  return `alert.${type}.${source}.${message}`
}

export const getAlertRouteAndType = (errorMessage: string) => {
  return {
    type: getAlertTypeFromErrorMessage(errorMessage),
    route: getI18nAlertRoute(errorMessage),
  }
}

export const getAlertContent = (
  errorType: string,
  errorMessage: string,
  showAlert = true
) => {
  const content = getAlertRouteAndType(
    `${errorType} Error: ${errorMessage.toLowerCase().replaceAll(' ', '-')}`
  )

  return {
    alertRoute: content.route,
    type: content.type as AlertType,
    show: showAlert,
  }
}
