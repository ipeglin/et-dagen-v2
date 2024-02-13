// DELETE /api/code
// endpoint for removing a registration code from db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // only admins can remove registration codes
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // get request body
  const { code } = await readBody(event)

  // delete code
  await deleteCode(code)

  // company successfully removed
  sendNoContent(event, 204)
})
