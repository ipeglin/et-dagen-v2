// POST /api/image
// endpoint for posting an image to storage bucket

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // only admins can post to storage bucket
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // get request body
  const formData = await readMultipartFormData(event)
  const file = formData?.[0]
  const storagePath = formData?.[1].data.toString()

  // if no file or companyUID
  if (!file || !storagePath)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing file or storagePath',
    })

  // check if file is correct type
  if (!(file.type === 'image/jpeg' || file.type === 'image/png'))
    throw createError({
      statusCode: 400,
      statusMessage: 'Firebase: Error (storage/unsupported-file-type).',
    })

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `${storagePath}/${file.filename}`
  const fileRef = bucket.file(filePath)

  // create new Buffer from FormData data buffer
  const imageBuffer = Buffer.from(file.data)

  const options = {
    resumable: false,
    public: true,
  }

  // save image buffer to the created reference
  await fileRef.save(imageBuffer, options).catch(() => {
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-upload-file).',
      })
    )
  })

  // return the public url of the image
  const URL = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return {
    URL,
  }
})
