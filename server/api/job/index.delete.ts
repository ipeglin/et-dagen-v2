// DELETE /api/job
// endpoint for removing a job from db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { jobUID } = getQuery(event)

  if (!jobUID)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing jobUID',
    })

  // reference to jobs
  const jobsRef = db.ref('jobs')

  // check if the job exists
  const snapshot = await jobsRef
    .orderByKey()
    .equalTo(jobUID as string)
    .once('value')

  const data = snapshot.val()

  // the job does not exist in db
  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Job not found',
    })

  const { companyUID } = data[Object.keys(data)[0]]

  const isAdmin = hasAccess(user, ['admin'])
  const isCompanyAdmin =
    hasAccess(user, ['company']) && user.companyUID === companyUID

  // only admins and company admins can modify jobs
  if (!isAdmin && !isCompanyAdmin)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // remove company
  jobsRef.child(jobUID as string).remove()

  // company successfully removed
  sendNoContent(event, 204)
})
