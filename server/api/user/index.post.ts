// POST /api/user
// endpoint for creating or updating a user in the database

export default defineEventHandler(async (event) => {
  const { decodedToken, user } = event.context

  // user is not authenticated
  if (!decodedToken)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // get request body and query param
  /* eslint-disable */
  let {
    uid,
    userType,
    studyProgram,
    currentYear,
    companyUID,
    dietaryRestrictions,
  } = await readBody(event)
  const { code: registrationCode } = getQuery(event)

  // studyprogram is required when creating, or modifying your own, normal user
  if (
    !registrationCode &&
    (!studyProgram || !currentYear) &&
    !hasAccess(user, ['admin', 'company'])
  )
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing study program',
    })

  // only admins can modify usertypes and other users than their own
  if (!hasAccess(user, ['admin']) || !uid) {
    // prevent users from creating multiple instances in the db
    uid = user?.uid ?? decodedToken.uid
    userType = user?.userType ?? 'basic'
    companyUID = user?.companyUID
  }

  // check validity of registration code
  // only applicable when creating a new company user
  if (registrationCode) {
    const { isValid, companyUID: codeCompanyUID } = await validateCode(
      registrationCode as string
    )

    // a valid code is required when creating a new company user
    if (!isValid)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid registration code',
      })

    userType = 'company'
    companyUID = codeCompanyUID

    // remove registration code from db
    deleteCode(registrationCode as string)
  }

  // reference to users
  const usersRef = db.ref('users')

  // add or update user in database
  usersRef.child(uid).update({
    userType: userType ?? null,
    studyProgram: userType === 'company' ? null : studyProgram,
    currentYear: userType === 'company' ? null : currentYear,
    companyUID: userType === 'company' ? companyUID : null,
    dietaryRestrictions: dietaryRestrictions ?? null,
    updated: Date.now(),
  })

  // user successfully modified
  sendNoContent(event, 201)
})
