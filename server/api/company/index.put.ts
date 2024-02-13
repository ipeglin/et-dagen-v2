// PUT /api/company
// endpoint for modifying companies in the db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // get request body
  const { companyUID, ...newData } = await readBody(event)

  const isAdmin = hasAccess(user, ['admin'])
  const isCompanyAdmin =
    hasAccess(user, ['company']) && user.companyUID === companyUID

  // only admins and company admins can modify companies
  if (!isAdmin && !isCompanyAdmin)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // reference to companies
  const companiesRef = db.ref('companies')

  // check if the company exists
  const snapshot = await companiesRef
    .orderByKey()
    .equalTo(companyUID)
    .once('value')

  const data = snapshot.val()

  // the company does not exist in db
  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Company not found',
    })

  // only admins can change company types
  if (!isAdmin) delete newData.type

  // update company data
  companiesRef.child(companyUID).update(newData)

  // successfully modified companies
  sendNoContent(event, 204)
})
