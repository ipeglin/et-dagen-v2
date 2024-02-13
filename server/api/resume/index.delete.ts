// DELETE /api/resume
// endpoint for deleting existing resumes

export default defineEventHandler(async (event) => {
  const { user } = event.context

  if (!hasAccess(user, ['basic', 'admin']))
    throw createError({
      statusCode: 400,
      statusMessage: 'User not authorized',
    })

  const { userUID } = await readBody(event)

  if (userUID !== user.uid)
    throw createError({
      statusCode: 401,
      statusMessage: 'User can only delete their own resume',
    })

  const file = user.resume.split('/')

  if (!file)
    throw createError({
      statusCode: 402,
      statusMessage: 'User does not have a resume',
    })

  // Get last element in array to get specific file name
  const filename = file[file.length - 1]

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `users/${userUID}/${filename}`
  const fileRef = bucket.file(filePath)

  // delete pdf buffer at reference
  await fileRef.delete().catch(() => {
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-delete-file).',
      })
    )
  })

  // Delete file reference from database
  const userRef = db.ref('users')
  userRef.child(userUID).child('resume').remove()

  sendNoContent(event, 204)
})
