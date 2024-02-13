// POST /api/user/signout
// endpoint for removing the token cookie after the user signs out

export default defineEventHandler((event) => {
  const { user } = event.context

  // user is not authenticated
  if (!user)
    throw createError({
      statusCode: 401,
      statusMessage: 'Not signed in',
    })

  deleteCookie(event, '_token')

  // send response to remove cookie
  sendNoContent(event, 204)
})
