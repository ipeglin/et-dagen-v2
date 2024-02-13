// DELETE /api/company
// endpoint for removing a company from db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // only admins can remove companies
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // get request body
  const { companyUID } = await readBody(event)

  // reference to companies
  const companiesRef = db.ref('companies')

  // remove company
  companiesRef.child(companyUID).remove()

  // fetch storage bucket
  const bucket = storage.bucket()

  // delete all files linked to company
  await bucket.deleteFiles({
    prefix: `companies/${companyUID}/`,
  })

  // company successfully removed
  sendNoContent(event, 204)
})
