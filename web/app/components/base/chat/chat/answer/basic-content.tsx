import type { FC } from 'react'
import type { ChatItem } from '../../types'
import { memo } from 'react'
import { Markdown } from '@/app/components/base/markdown'
import useTheme from '@/hooks/use-theme'
import { cn } from '@/utils/classnames'
import { formatImageUrlsForMarkdown } from './content-formatters'

type BasicContentProps = {
  item: ChatItem
}
const BasicContent: FC<BasicContentProps> = ({
  item,
}) => {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  const {
    annotation,
    content,
  } = item

  if (annotation?.logAnnotation) {
    return (
      <Markdown
        className={cn(isDarkMode ? '!text-slate-50' : '!text-slate-900')}
        content={annotation?.logAnnotation.content || ''}
        data-testid="basic-content-markdown"
      />
    )
  }

  // Preserve Windows UNC paths and similar backslash-heavy strings by
  // wrapping them in inline code so Markdown renders backslashes verbatim.
  let displayContent = content
  if (typeof content === 'string' && /^\\\\\S.*/.test(content) && !/^`.*`$/.test(content)) {
    displayContent = `\`${content}\``
  }
  else if (typeof content === 'string') {
    displayContent = formatImageUrlsForMarkdown(content)
  }

  return (
    <Markdown
      className={cn(
        isDarkMode ? '!text-slate-50' : '!text-slate-900',
        item.isError && '!text-[#F04438]',
      )}
      content={displayContent}
      data-testid="basic-content-markdown"
    />
  )
}

export default memo(BasicContent)
