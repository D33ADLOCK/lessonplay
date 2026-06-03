export function getPostgresUrl() {
  const url = process.env.POSTGRES_URL

  if (!url) {
    return undefined
  }

  try {
    const parsed = new URL(url)
    decodeURIComponent(parsed.password)
    return url
  } catch (error) {
    if (!(error instanceof URIError)) {
      throw error
    }

    const parsed = new URL(url)
    parsed.password = parsed.password.replace(/%/g, '%25')
    return parsed.toString()
  }
}
