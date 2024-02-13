// GET /api/user
// endpoint for fetching user data from database

export default defineEventHandler(async (event) => {
  const { decodedToken, user } = event.context

  // user is not authenticated
  if (!decodedToken)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  if (!user)
    throw createError({
      statusCode: 404,
      statusMessage: 'User data not found',
    })

  // get scope from query params
  const { scope } = getQuery(event)

  // only admins can get other users than their own
  // TODO! Restrict company user access by adding custom endpoint for /api/company/events/users
  if (!hasAccess(user, ['admin', 'company']) || !scope || scope !== 'all')
    return user

  // reference to users
  const usersRef = db.ref('users')

  // get all users from db
  const snapshot = await usersRef.once('value')
  const dbUsers = snapshot.val()

  // get the first 1000 users from firebase auth
  const firebaseUsers = await auth.listUsers()

  // combine users from db and firebase auth
  const users = firebaseUsers.users.map((firebaseUser) => ({
    ...formatFirebaseUser(firebaseUser),
    ...dbUsers[firebaseUser.uid],
  }))

  return users
})
