// POST /api/resume
// endpoint for inserting pdf into storage bucket

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // get request body
  const body = await readMultipartFormData(event)
  const file = body?.[0]
  const userUID = body?.[1].data.toString()

  // check if user is authorized
  if (!hasAccess(user, ['basic', 'admin']))
    throw createError({
      statusCode: 400,
      statusMessage: 'User not authorized',
    })

  if (userUID !== user.uid)
    throw createError({
      statusCode: 401,
      statusMessage: 'Cannot upload resume to other users',
    })

  // check if body content is defined
  if (!file || !user || !userUID)
    throw createError({
      statusCode: 402,
      statusMessage: 'Firebase: Error (storage/data-not-defined)',
    })

  // check if file is correct type (only pdf is allowed)
  if (file.type !== 'application/pdf') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Firebase: Error (storage/unsupported-file-type)',
    })
  }

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `users/${userUID}/${file.filename}`
  const fileRef = bucket.file(filePath)

  // create new buffer
  const documentBuffer = Buffer.from(file.data)

  const options = {
    resumable: false,
    public: true,
  }

  // save pdf buffer to created reference
  await fileRef.save(documentBuffer, options).catch(() => {
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-upload-file).',
      })
    )
  })

  // return public url of pdf
  const URL = `https://storage.googleapis.com/${bucket.name}/${filePath}`

  const userRef = db.ref(`users/${userUID}`)

  userRef.update({ resume: URL })
  return URL
})
