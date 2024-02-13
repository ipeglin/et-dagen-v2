// DELETE /api/user
// endpoint for removing a user in the database

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // user is not authenticated
  if (!user)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // get request body
  let { UIDs } = await readBody(event)

  // only admins can remove other users than their own
  if (!hasAccess(user, ['admin']) || !UIDs) {
    UIDs = user.uid
  }

  // UIDs can be passed both as an array or a single UID string
  if (typeof UIDs !== 'object') UIDs = [UIDs]

  // reference to users
  const usersRef = db.ref('users')

  // remove users from db
  usersRef.update(
    // format UIDs array as object with the UIDs as keys and values null
    Object.assign({}, ...(UIDs as string[]).map((uid) => ({ [uid]: null })))
  )

  // remove firebase auth users
  await auth.deleteUsers(UIDs)

  // users successfully removed
  sendNoContent(event, 204)
})
