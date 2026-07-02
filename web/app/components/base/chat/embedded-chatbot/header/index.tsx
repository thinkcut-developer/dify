import type { FC } from 'react'
import type { Theme } from '../theme/theme-context'
import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ActionButton from '@/app/components/base/action-button'
import ViewFormDropdown from '@/app/components/base/chat/embedded-chatbot/inputs-form/view-form-dropdown'
import Divider from '@/app/components/base/divider'
import DifyLogo from '@/app/components/base/logo/dify-logo'
import Tooltip from '@/app/components/base/tooltip'
import { useGlobalPublicStore } from '@/context/global-public-context'
import useTheme from '@/hooks/use-theme'
import { cn } from '@/utils/classnames'
import { isClient } from '@/utils/client'
import {
  useEmbeddedChatbotContext,
} from '../context'
import { CssTransform } from '../theme/utils'

export type IHeaderProps = {
  isMobile?: boolean
  allowResetChat?: boolean
  customerIcon?: React.ReactNode
  title: string
  theme?: Theme
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  isMobile,
  allowResetChat,
  customerIcon,
  title,
  theme,
  onCreateNewChat,
}) => {
  const { t } = useTranslation()
  const {
    appData,
    currentConversationId,
    inputsForms,
    allInputsHidden,
  } = useEmbeddedChatbotContext()

  const isIframe = isClient ? window.self !== window.top : false
  const [parentOrigin, setParentOrigin] = useState('')
  const [showToggleExpandButton, setShowToggleExpandButton] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const { theme: appTheme } = useTheme()
  const isDarkMode = appTheme === 'dark'

  const handleMessageReceived = useCallback((event: MessageEvent) => {
    let currentParentOrigin = parentOrigin
    if (!currentParentOrigin && event.data.type === 'dify-chatbot-config') {
      currentParentOrigin = event.origin
      setParentOrigin(event.origin)
    }
    if (event.origin !== currentParentOrigin)
      return
    if (event.data.type === 'dify-chatbot-config')
      setShowToggleExpandButton(!!event.data.payload.isToggledByButton)
  }, [parentOrigin])

  useEffect(() => {
    if (!isIframe)
      return

    const listener = (event: MessageEvent) => handleMessageReceived(event)
    window.addEventListener('message', listener)

    // Security: Use document.referrer to get parent origin
    const targetOrigin = document.referrer ? new URL(document.referrer).origin : '*'
    window.parent.postMessage({ type: 'dify-chatbot-iframe-ready' }, targetOrigin)

    return () => window.removeEventListener('message', listener)
  }, [isIframe, handleMessageReceived])

  const handleToggleExpand = useCallback(() => {
    if (!isIframe || !showToggleExpandButton)
      return
    setExpanded(prev => !prev)

    const message = { type: 'dify-chatbot-expand-change' }

    // Prefer locked parent origin, then referrer origin, finally wildcard as a safe delivery fallback.
    // Parent side already validates sender origin before applying expand state.
    const fallbackOrigin = (() => {
      if (!isClient)
        return '*'
      if (parentOrigin)
        return parentOrigin
      if (document.referrer) {
        try {
          return new URL(document.referrer).origin
        }
        catch {
          return '*'
        }
      }
      return '*'
    })()

    try {
      window.parent.postMessage(message, fallbackOrigin)
    }
    catch {
      window.parent.postMessage(message, '*')
    }
  }, [isIframe, parentOrigin, showToggleExpandButton])

  if (!isMobile) {
    return (
      <div
        className={cn(
          'flex h-14 shrink-0 items-center justify-end p-3 backdrop-blur-md',
          isDarkMode
            ? 'border-b border-white/8 bg-[linear-gradient(90deg,rgba(12,18,32,0.92)_0%,rgba(18,24,42,0.86)_100%)]'
            : 'border-b border-slate-200/85 bg-[linear-gradient(90deg,rgba(255,255,255,0.88)_0%,rgba(241,245,249,0.92)_100%)]',
        )}
      >
        <div className="flex items-center gap-1">
          {/* powered by */}
          <div className="shrink-0">
            {!appData?.custom_config?.remove_webapp_brand && (
              <div
                className={cn(
                  'flex shrink-0 items-center gap-1.5 px-2',
                )}
                data-testid="webapp-brand"
              >
                {
                  appData?.custom_config?.replace_webapp_logo
                    ? <img src={`${appData?.custom_config?.replace_webapp_logo}`} alt="logo" className="block h-5 w-auto" />
                    : systemFeatures.branding.enabled && systemFeatures.branding.workspace_logo
                      ? <img src={systemFeatures.branding.workspace_logo} alt="logo" className="block h-5 w-auto" />
                      : <DifyLogo size="small" />
                }
                <div className="system-1xs-medium-uppercase text-[8px] text-text-tertiary">{t('chat.poweredBy', { ns: 'share' })}</div>
              </div>
            )}
          </div>
          {currentConversationId && (
            <Divider type="vertical" className="h-3.5" />
          )}
          {
            showToggleExpandButton && (
              <Tooltip
                popupContent={expanded ? t('chat.collapse', { ns: 'share' }) : t('chat.expand', { ns: 'share' })}
              >
                <ActionButton size="l" onClick={handleToggleExpand} data-testid="expand-button">
                  {
                    expanded
                      ? <div className="i-ri-collapse-diagonal-2-line h-[18px] w-[18px]" />
                      : <div className="i-ri-expand-diagonal-2-line h-[18px] w-[18px]" />
                  }
                </ActionButton>
              </Tooltip>
            )
          }
          {currentConversationId && allowResetChat && (
            <Tooltip
              popupContent={t('chat.resetChat', { ns: 'share' })}
            >
              <ActionButton size="l" onClick={onCreateNewChat} data-testid="reset-chat-button">
                <div className="i-ri-reset-left-line h-[18px] w-[18px]" />
              </ActionButton>
            </Tooltip>
          )}
          {currentConversationId && inputsForms.length > 0 && !allInputsHidden && (
            <ViewFormDropdown />
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-14 shrink-0 items-center justify-between rounded-t-[28px] px-4',
        !isDarkMode && 'border-b border-slate-200/85 bg-[linear-gradient(90deg,rgba(255,255,255,0.88)_0%,rgba(241,245,249,0.92)_100%)] backdrop-blur-md',
      )}
      style={isDarkMode
        ? Object.assign(
            {},
            CssTransform(theme?.backgroundHeaderColorStyle ?? ''),
            CssTransform(theme?.headerBorderBottomStyle ?? ''),
          )
        : {}}
    >
      <div className="flex grow items-center space-x-3">
        {customerIcon}
        <div
          className={cn('truncate system-md-semibold', !isDarkMode && 'text-slate-900')}
          style={isDarkMode ? CssTransform(theme?.colorFontOnHeaderStyle ?? '') : {}}
        >
          {title}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {
          showToggleExpandButton && (
            <Tooltip
              popupContent={expanded ? t('chat.collapse', { ns: 'share' }) : t('chat.expand', { ns: 'share' })}
            >
              <ActionButton size="l" onClick={handleToggleExpand} data-testid="mobile-expand-button">
                {
                  expanded
                    ? <div className={cn('i-ri-collapse-diagonal-2-line h-[18px] w-[18px]', isDarkMode ? theme?.colorPathOnHeader : 'text-slate-500')} />
                    : <div className={cn('i-ri-expand-diagonal-2-line h-[18px] w-[18px]', isDarkMode ? theme?.colorPathOnHeader : 'text-slate-500')} />
                }
              </ActionButton>
            </Tooltip>
          )
        }
        {currentConversationId && allowResetChat && (
          <Tooltip
            popupContent={t('chat.resetChat', { ns: 'share' })}
          >
            <ActionButton size="l" onClick={onCreateNewChat} data-testid="mobile-reset-chat-button">
              <div className={cn('i-ri-reset-left-line h-[18px] w-[18px]', isDarkMode ? theme?.colorPathOnHeader : 'text-slate-500')} />
            </ActionButton>
          </Tooltip>
        )}
        {currentConversationId && inputsForms.length > 0 && !allInputsHidden && (
          <ViewFormDropdown iconColor={isDarkMode ? theme?.colorPathOnHeader : 'text-slate-500'} />
        )}
      </div>
    </div>
  )
}

export default React.memo(Header)
