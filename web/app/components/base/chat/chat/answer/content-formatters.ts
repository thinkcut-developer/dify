const IMAGE_URL_REGEX = /^https?:\/\/\S+\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#]\S*)?$/i

const IMAGE_LABEL_REGEX = /^(https?:\/\/\S+)$/i

export const formatImageUrlsForMarkdown = (content: string) => {
  return content
    .split('\n')
    .map((line) => {
      const trimmedLine = line.trim()
      if (!trimmedLine)
        return line

      if (trimmedLine.startsWith('!['))
        return line

      if (IMAGE_URL_REGEX.test(trimmedLine))
        return line.replace(trimmedLine, `![](${trimmedLine})`)

      const separatorIndex = line.lastIndexOf(': http')
      if (separatorIndex < 0)
        return line

      const label = line.slice(0, separatorIndex + 1)
      const url = line.slice(separatorIndex + 2).trim()
      const labeledImageMatch = url.match(IMAGE_LABEL_REGEX)
      if (!labeledImageMatch)
        return line

      if (!IMAGE_URL_REGEX.test(url))
        return line

      return `${label}\n\n![](${url})`
    })
    .join('\n')
}
