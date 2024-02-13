// DELETE /api/event
// Endpoint for deleting existing events

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { eventUID, companyUID } = await readBody(event)

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage: 'Company users cannot delete events for other companies',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // Check if input is valid
  if (!eventUID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing eventUID',
    })
  }

  // Reference to events
  const eventsRef = db.ref('events')

  // Remove event from database
  eventsRef.child(eventUID).remove()

  // Event removed successfully
  sendNoContent(event, 204)
})
