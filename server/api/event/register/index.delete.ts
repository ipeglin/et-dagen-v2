// DELETE /api/event/register/:eventUID

// endpoint for opting out of an event
export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { eventUID, userUID } = await readBody(event)

  // user is not authenticated
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Firebase: Error (auth/user-not-found).',
    })
  }

  // eventUID is not provided
  if (!eventUID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event: Error (event/missing-event-id).',
    })
  }

  // Only admins can modify event attendants
  if (userUID && userUID !== user.uid && !hasAccess(user, ['admin'])) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Events: Error (register/non-admin-user).',
    })
  }

  // Get event from database
  const eventsRef = db.ref('events')
  const snapshot = await eventsRef.orderByKey().equalTo(eventUID).once('value')
  const data = snapshot.val()

  // Event does not exist
  if (!data || !data[eventUID]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (event/event-doesnt-exists).',
    })
  }

  // check if sign up start and opt out deadline is before event start
  if (
    !hasAccess(user, ['admin']) &&
    !presentWithinTimeWindow(
      data[eventUID].registration.start,
      data[eventUID].registration.end
    )
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/registration-closed).',
    })
  }

  // Get attendee key for user
  const attendees = data[eventUID].attendants

  // Delete other user if admin, and userUID provided in body
  const attendantUID: string | undefined = userUID
    ? Object.entries(attendees ?? {}).find(
        (attendant) => attendant[1] === userUID
      )?.[0]
    : Object.entries(attendees ?? {}).find(
        (attendant) => attendant[1] === user.uid
      )?.[0]

  // User is not registered for this event
  if (!attendantUID) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/user-not-registered).',
    })
  }

  // Remove user from attendants
  delete attendees[attendantUID]

  // Update attendants
  eventsRef.child(eventUID).child('attendants').set(attendees)

  // User successfully opted out of event
  sendNoContent(event, 201)
})
