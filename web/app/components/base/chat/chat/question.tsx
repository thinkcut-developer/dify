import type {
  FC,
  ReactNode,
} from 'react'
import type { Theme } from '../embedded-chatbot/theme/theme-context'
import type { ChatItem } from '../types'
import { RiUser3Line } from '@remixicon/react'
import copy from 'copy-to-clipboard'
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import Textarea from 'react-textarea-autosize'
import { FileList } from '@/app/components/base/file-uploader'
import { Markdown } from '@/app/components/base/markdown'
import useTheme from '@/hooks/use-theme'
import { cn } from '@/utils/classnames'
import ActionButton from '../../action-button'
import Button from '../../button'
import Toast from '../../toast'
import { CssTransform } from '../embedded-chatbot/theme/utils'
import ContentSwitch from './content-switch'
import { useChatContext } from './context'

type QuestionProps = {
  item: ChatItem
  questionIcon?: ReactNode
  theme: Theme | null | undefined
  enableEdit?: boolean
  switchSibling?: (siblingMessageId: string) => void
  hideAvatar?: boolean
}

const Question: FC<QuestionProps> = ({
  item,
  questionIcon,
  theme,
  enableEdit = true,
  switchSibling,
  hideAvatar,
}) => {
  const { t } = useTranslation()
  const { theme: appTheme } = useTheme()
  const isDarkMode = appTheme === 'dark'

  const {
    content,
    message_files,
  } = item

  const {
    onRegenerate,
  } = useChatContext()

  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [contentWidth, setContentWidth] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const isComposingRef = useRef(false)
  const compositionEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setEditedContent(content)
  }, [content])

  const handleResend = useCallback(() => {
    if (compositionEndTimerRef.current) {
      clearTimeout(compositionEndTimerRef.current)
      compositionEndTimerRef.current = null
    }
    isComposingRef.current = false
    setIsEditing(false)
    onRegenerate?.(item, { message: editedContent, files: message_files })
  }, [editedContent, message_files, item, onRegenerate])

  const handleCancelEditing = useCallback(() => {
    if (compositionEndTimerRef.current) {
      clearTimeout(compositionEndTimerRef.current)
      compositionEndTimerRef.current = null
    }
    isComposingRef.current = false
    setIsEditing(false)
    setEditedContent(content)
  }, [content])

  const handleEditInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey)
      return

    if (e.nativeEvent.isComposing)
      return

    if (isComposingRef.current) {
      e.preventDefault()
      return
    }

    e.preventDefault()
    handleResend()
  }, [handleResend])

  const clearCompositionEndTimer = useCallback(() => {
    if (!compositionEndTimerRef.current)
      return

    clearTimeout(compositionEndTimerRef.current)
    compositionEndTimerRef.current = null
  }, [])

  const handleCompositionStart = useCallback(() => {
    clearCompositionEndTimer()
    isComposingRef.current = true
  }, [clearCompositionEndTimer])

  const handleCompositionEnd = useCallback(() => {
    clearCompositionEndTimer()
    compositionEndTimerRef.current = setTimeout(() => {
      isComposingRef.current = false
      compositionEndTimerRef.current = null
    }, 50)
  }, [clearCompositionEndTimer])

  const handleSwitchSibling = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (item.prevSibling)
        switchSibling?.(item.prevSibling)
    }
    else {
      if (item.nextSibling)
        switchSibling?.(item.nextSibling)
    }
  }, [switchSibling, item.prevSibling, item.nextSibling])

  const getContentWidth = () => {
    /* v8 ignore next 2 -- @preserve */
    if (contentRef.current)
      setContentWidth(contentRef.current?.clientWidth)
  }

  useEffect(() => {
    /* v8 ignore next 2 -- @preserve */
    if (!contentRef.current)
      return
    const resizeObserver = new ResizeObserver(() => {
      getContentWidth()
    })
    resizeObserver.observe(contentRef.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    return () => {
      clearCompositionEndTimer()
    }
  }, [clearCompositionEndTimer])

  return (
    <div className="mb-2 flex justify-end last:mb-0">
      <div className={cn('group relative mr-4 flex max-w-full items-start overflow-x-hidden pl-14', isEditing && 'flex-1')}>
        <div className={cn('mr-2 gap-1', isEditing ? 'hidden' : 'flex')}>
          <div
            data-testid="action-container"
            className="absolute hidden gap-0.5 rounded-[10px] border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 shadow-md backdrop-blur-sm group-hover:flex"
            style={{ right: contentWidth + 8 }}
          >
            <ActionButton
              data-testid="copy-btn"
              onClick={() => {
                copy(content)
                Toast.notify({ type: 'success', message: t('actionMsg.copySuccessfully', { ns: 'common' }) })
              }}
            >
              <div className="i-ri-clipboard-line h-4 w-4" />
            </ActionButton>
            {enableEdit && (
              <ActionButton data-testid="edit-btn" onClick={handleEdit}>
                <div className="i-ri-edit-line h-4 w-4" />
              </ActionButton>
            )}
          </div>
        </div>
        <div
          ref={contentRef}
          data-testid="question-content"
          className={cn(
            'w-full px-5 py-3.5 text-sm',
            !isEditing && (isDarkMode
              ? 'border-white/12 rounded-[22px] border bg-[linear-gradient(135deg,#1f2a44_0%,#263161_55%,#312e81_100%)] text-slate-50 shadow-[0_14px_28px_rgba(15,23,42,0.34)] backdrop-blur-sm'
              : 'rounded-[22px] border border-indigo-200/70 bg-[linear-gradient(135deg,#334155_0%,#3730a3_100%)] text-slate-50 shadow-[0_16px_28px_rgba(99,102,241,0.16)] backdrop-blur-sm'),
            isEditing && 'rounded-[24px] border-[2px] border-components-option-card-option-selected-border bg-components-panel-bg-blur shadow-xl',
          )}
          style={(!isEditing && theme?.chatBubbleColorStyle) ? CssTransform(theme.chatBubbleColorStyle) : {}}
        >
          {
            !!message_files?.length && (
              <FileList
                className={cn(isEditing ? 'mb-3' : 'mb-2')}
                files={message_files}
                showDeleteAction={false}
                showDownloadAction={true}
              />
            )
          }
          {!isEditing
            ? <Markdown className="!text-slate-50" content={content} />
            : (
                <div className="flex flex-col gap-4">
                  <div className="max-h-[158px] overflow-y-auto overflow-x-hidden pr-1">
                    <Textarea
                      className={cn(
                        'w-full resize-none bg-transparent p-0 leading-7 text-slate-50 outline-none body-lg-regular',
                      )}
                      autoFocus
                      minRows={1}
                      value={editedContent}
                      onChange={e => setEditedContent(e.target.value)}
                      onKeyDown={handleEditInputKeyDown}
                      onCompositionStart={handleCompositionStart}
                      onCompositionEnd={handleCompositionEnd}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button className="min-w-24" onClick={handleCancelEditing} data-testid="cancel-edit-btn">{t('operation.cancel', { ns: 'common' })}</Button>
                    <Button className="min-w-24" variant="primary" onClick={handleResend} data-testid="save-edit-btn">{t('operation.save', { ns: 'common' })}</Button>
                  </div>
                </div>
              )}
          {!isEditing && (
            <ContentSwitch
              count={item.siblingCount}
              currentIndex={item.siblingIndex}
              prevDisabled={!item.prevSibling}
              nextDisabled={!item.nextSibling}
              switchSibling={handleSwitchSibling}
            />
          )}
        </div>
        <div className="mt-1 h-[18px]" />
      </div>
      {!hideAvatar && (
        <div className="h-10 w-10 shrink-0">
          {
            questionIcon || (
              <div className="flex h-full w-full items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-slate-700 to-indigo-900 text-slate-100 shadow-md shadow-black/25">
                <RiUser3Line className="h-5 w-5" />
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

export default memo(Question)
