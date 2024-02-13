// POST /api/code
// endpoint for creating registration codes in the db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // only admins can create new registration codes
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  const { companyUID } = getQuery(event)

  // companyUID is missing
  if (!companyUID)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing companyUID',
    })

  // reference to companies
  const companiesRef = db.ref('companies')

  // check if the company exists
  const snapshot = await companiesRef
    .orderByKey()
    .equalTo(companyUID as string)
    .once('value')

  const data = snapshot.val()

  // the company does not exist in db
  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Company not found',
    })

  // reference to registration codes in db
  const registrationCodesRef = db.ref('registrationCodes')

  // create values for code
  const kebabCaseName = data[companyUID as string].name
    .replace(/\s+/g, '-')
    .toLowerCase()
  const randomString = generateRandomString(8)

  // create code in db
  registrationCodesRef.push({
    code: `${kebabCaseName}-${randomString}`,
    companyUID,
  })

  // successfully created registration code
  sendNoContent(event, 201)
})
