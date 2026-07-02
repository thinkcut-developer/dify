import type { FileEntity } from '../../file-uploader/types'
import type {
  ChatConfig,
  ChatItem,
  OnSend,
} from '../types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AnswerIcon from '@/app/components/base/answer-icon'
import AppIcon from '@/app/components/base/app-icon'
import SuggestedQuestions from '@/app/components/base/chat/chat/answer/suggested-questions'
import InputsForm from '@/app/components/base/chat/embedded-chatbot/inputs-form'
import LogoAvatar from '@/app/components/base/logo/logo-embedded-chat-avatar'
import { Markdown } from '@/app/components/base/markdown'
import { InputVarType } from '@/app/components/workflow/types'
import useTheme from '@/hooks/use-theme'
import {
  AppSourceType,
  fetchSuggestedQuestions,
  getUrl,
  stopChatMessageResponding,
  submitHumanInputForm,
} from '@/service/share'
import { submitHumanInputForm as submitHumanInputFormService } from '@/service/workflow'
import { TransferMethod } from '@/types/app'
import { cn } from '@/utils/classnames'
import { Avatar } from '../../avatar'
import Chat from '../chat'
import { useChat } from '../chat/hooks'
import { getLastAnswer, isValidGeneratedAnswer } from '../utils'
import { useEmbeddedChatbotContext } from './context'
import { isDify } from './utils'

const ChatWrapper = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  const {
    appData,
    appParams,
    appPrevChatList,
    currentConversationId,
    currentConversationItem,
    currentConversationInputs,
    inputsForms,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationActivated,
    handleNewConversationCompleted,
    isMobile,
    isInstalledApp,
    appId,
    appMeta,
    disableFeedback,
    handleFeedback,
    currentChatInstanceRef,
    themeBuilder,
    clearChatList,
    setClearChatList,
    setIsResponding,
    allInputsHidden,
    initUserVariables,
    appSourceType,
  } = useEmbeddedChatbotContext()

  // Read sendOnEnter from URL params (e.g., ?sendOnEnter=false)
  const sendOnEnter = useMemo(() => {
    if (typeof window === 'undefined')
      return true
    const urlParams = new URLSearchParams(window.location.search)
    const param = urlParams.get('sendOnEnter')
    return param !== 'false'
  }, [])

  const appConfig = useMemo(() => {
    const config = appParams || {}

    return {
      ...config,
      file_upload: {
        ...(config as any).file_upload,
        fileUploadConfig: (config as any).system_parameters,
      },
      supportFeedback: true,
      opening_statement: currentConversationItem?.introduction || (config as any).opening_statement,
    } as ChatConfig
  }, [appParams, currentConversationItem?.introduction])
  const {
    chatList,
    handleSend,
    handleStop,
    handleSwitchSibling,
    isResponding: respondingState,
    suggestedQuestions,
  } = useChat(
    appConfig,
    {
      inputs: (currentConversationId ? currentConversationInputs : newConversationInputs) as any,
      inputsForm: inputsForms,
    },
    appPrevChatList,
    taskId => stopChatMessageResponding('', taskId, appSourceType, appId),
    clearChatList,
    setClearChatList,
  )
  const inputsFormValue = currentConversationId ? currentConversationInputs : newConversationInputsRef?.current
  const inputDisabled = useMemo(() => {
    if (allInputsHidden)
      return false

    let hasEmptyInput = ''
    let fileIsUploading = false
    const requiredVars = inputsForms.filter(({ required, type }) => required && type !== InputVarType.checkbox) // boolean can be not checked
    if (requiredVars.length) {
      requiredVars.forEach(({ variable, label, type }) => {
        if (hasEmptyInput)
          return

        if (fileIsUploading)
          return

        if (!inputsFormValue?.[variable])
          hasEmptyInput = label as string

        if ((type === InputVarType.singleFile || type === InputVarType.multiFiles) && inputsFormValue?.[variable]) {
          const files = inputsFormValue[variable]
          if (Array.isArray(files))
            fileIsUploading = files.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)
          else
            fileIsUploading = files.transferMethod === TransferMethod.local_file && !files.uploadedId
        }
      })
    }
    if (hasEmptyInput)
      return true

    if (fileIsUploading)
      return true
    return false
  }, [inputsFormValue, inputsForms, allInputsHidden])

  useEffect(() => {
    if (currentChatInstanceRef.current)
      currentChatInstanceRef.current.handleStop = handleStop
  }, [currentChatInstanceRef, handleStop])
  useEffect(() => {
    setIsResponding(respondingState)
  }, [respondingState, setIsResponding])

  const doSend: OnSend = useCallback((message, files, isRegenerate = false, parentAnswer: ChatItem | null = null) => {
    const data: any = {
      query: message,
      files,
      inputs: currentConversationId ? currentConversationInputs : newConversationInputs,
      conversation_id: currentConversationId,
      parent_message_id: (isRegenerate ? parentAnswer?.id : getLastAnswer(chatList)?.id) || null,
    }
    handleSend(
      getUrl('chat-messages', appSourceType, appId || ''),
      data,
      {
        onGetSuggestedQuestions: responseItemId => fetchSuggestedQuestions(responseItemId, appSourceType, appId),
        onConversationIdAssigned: currentConversationId ? undefined : handleNewConversationActivated,
        onConversationComplete: currentConversationId ? undefined : handleNewConversationCompleted,
        isPublicAPI: appSourceType === AppSourceType.webApp,
      },
    )
  }, [currentConversationId, currentConversationInputs, newConversationInputs, chatList, handleSend, appSourceType, appId, handleNewConversationActivated, handleNewConversationCompleted])

  const doRegenerate = useCallback((chatItem: ChatItem, editedQuestion?: { message: string, files?: FileEntity[] }) => {
    const question = editedQuestion ? chatItem : chatList.find(item => item.id === chatItem.parentMessageId)!
    const parentAnswer = chatList.find(item => item.id === question.parentMessageId)
    doSend(editedQuestion ? editedQuestion.message : question.content, editedQuestion ? editedQuestion.files : question.message_files, true, isValidGeneratedAnswer(parentAnswer) ? parentAnswer : null)
  }, [chatList, doSend])

  const doSwitchSibling = useCallback((siblingMessageId: string) => {
    handleSwitchSibling(siblingMessageId, {
      onGetSuggestedQuestions: responseItemId => fetchSuggestedQuestions(responseItemId, appSourceType, appId),
      onConversationIdAssigned: currentConversationId ? undefined : handleNewConversationActivated,
      onConversationComplete: currentConversationId ? undefined : handleNewConversationCompleted,
      isPublicAPI: appSourceType === AppSourceType.webApp,
    })
  }, [handleSwitchSibling, appSourceType, appId, currentConversationId, handleNewConversationActivated, handleNewConversationCompleted])

  const messageList = useMemo(() => {
    if (currentConversationId || chatList.length > 1)
      return chatList
    // Without messages we are in the welcome screen, so hide the opening statement from chatlist
    return chatList.filter(item => !item.isOpeningStatement)
  }, [chatList, currentConversationId])

  const isTryApp = appSourceType === AppSourceType.tryApp
  const [collapsed, setCollapsed] = useState(!!currentConversationId && !isTryApp) // try app always use the new chat

  const chatNode = useMemo(() => {
    if (allInputsHidden || !inputsForms.length)
      return null
    if (isMobile) {
      if (!currentConversationId)
        return <InputsForm collapsed={collapsed} setCollapsed={setCollapsed} />
      return <div className="mb-4"></div>
    }
    else {
      return <InputsForm collapsed={collapsed} setCollapsed={setCollapsed} />
    }
  }, [inputsForms.length, isMobile, currentConversationId, collapsed, allInputsHidden])

  const handleSubmitHumanInputForm = useCallback(async (formToken: string, formData: any) => {
    if (isInstalledApp)
      await submitHumanInputFormService(formToken, formData)
    else
      await submitHumanInputForm(formToken, formData)
  }, [isInstalledApp])

  const welcome = useMemo(() => {
    const welcomeMessage = chatList.find(item => item.isOpeningStatement)
    if (respondingState)
      return null
    if (currentConversationId)
      return null
    if (!welcomeMessage)
      return null
    if (!collapsed && inputsForms.length > 0 && !allInputsHidden)
      return null
    if (!appData?.site)
      return null
    if (welcomeMessage.suggestedQuestions && welcomeMessage.suggestedQuestions?.length > 0) {
      return (
        <div className={cn('flex items-center justify-center px-4 py-12', isMobile ? 'min-h-[30vh] py-0' : 'h-[50vh]')}>
          <div className="flex max-w-[720px] grow gap-4">
            <AppIcon
              size="xl"
              iconType={appData?.site.icon_type}
              icon={appData?.site.icon}
              background={appData?.site.icon_background}
              imageUrl={appData?.site.icon_url}
            />
            <div
              className={cn(
                'grow rounded-[22px] px-5 py-3.5 backdrop-blur-sm body-lg-regular',
                isDarkMode
                  ? 'border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96)_0%,rgba(15,23,42,0.92)_100%)] text-slate-50 shadow-[0_16px_30px_rgba(2,6,23,0.28)]'
                  : 'border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] text-slate-900 shadow-[0_18px_32px_rgba(148,163,184,0.22)]',
              )}
            >
              <Markdown className={cn(isDarkMode ? '!text-slate-50' : '!text-slate-900')} content={welcomeMessage.content} />
              <SuggestedQuestions item={welcomeMessage} />
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-3 py-12', isMobile ? 'min-h-[30vh] py-0' : 'h-[50vh]')}>
        <AppIcon
          size="xl"
          iconType={appData?.site.icon_type}
          icon={appData?.site.icon}
          background={appData?.site.icon_background}
          imageUrl={appData?.site.icon_url}
        />
        <div className="max-w-[768px] px-4">
          <Markdown className="!text-slate-200 !body-2xl-regular" content={welcomeMessage.content} />
        </div>
      </div>
    )
  }, [chatList, respondingState, currentConversationId, collapsed, inputsForms.length, allInputsHidden, appData?.site, isMobile])

  const answerIcon = isDify()
    ? <LogoAvatar className="relative shrink-0" />
    : (appData?.site && appData.site.use_icon_as_answer_icon)
        ? (
            <AnswerIcon
              iconType={appData.site.icon_type}
              icon={appData.site.icon}
              background={appData.site.icon_background}
              imageUrl={appData.site.icon_url}
            />
          )
        : null

  return (
    <Chat
      isTryApp={isTryApp}
      appData={appData || undefined}
      config={appConfig}
      chatList={messageList}
      isResponding={respondingState}
      chatContainerClassName={isDarkMode
        ? 'bg-[linear-gradient(180deg,#0b1220_0%,#070d18_100%)]'
        : 'bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]'}
      chatContainerInnerClassName={cn('mx-auto w-full max-w-full px-4 pb-4', messageList.length && 'pt-4')}
      chatFooterClassName={cn(
        isDarkMode
          ? '!bg-[linear-gradient(180deg,rgba(11,18,32,0.02)_0%,rgba(7,13,24,0.82)_28%,rgba(7,13,24,0.98)_100%)]'
          : '!bg-[linear-gradient(180deg,rgba(248,250,252,0.02)_0%,rgba(238,242,255,0.82)_28%,rgba(238,242,255,0.98)_100%)]',
        'px-2 pb-5 pt-3',
        !isMobile && 'rounded-b-[28px]',
      )}
      chatFooterInnerClassName={cn(
        'mx-auto w-full max-w-full',
        isMobile ? 'px-2 pr-2' : 'px-1 pr-0',
      )}
      onSend={doSend}
      inputs={currentConversationId ? currentConversationInputs as any : newConversationInputs}
      inputsForm={inputsForms}
      onRegenerate={doRegenerate}
      onStopResponding={handleStop}
      onHumanInputFormSubmit={handleSubmitHumanInputForm}
      chatNode={(
        <>
          {chatNode}
          {welcome}
        </>
      )}
      allToolIcons={appMeta?.tool_icons || {}}
      disableFeedback={disableFeedback}
      onFeedback={handleFeedback}
      suggestedQuestions={suggestedQuestions}
      answerIcon={answerIcon}
      hideProcessDetail
      themeBuilder={themeBuilder}
      switchSibling={doSwitchSibling}
      inputDisabled={inputDisabled}
      chatInputBotName="ThinkAI"
      sendOnEnter={sendOnEnter}
      footerNotice={(
        <div className={cn(
          isDarkMode
            ? 'bg-slate-900/78 rounded-2xl border border-white/10 px-3 py-1.5 text-left text-xs leading-5 text-slate-300 shadow-[0_12px_26px_rgba(2,6,23,0.26)] backdrop-blur-md'
            : 'bg-white/86 rounded-2xl border border-slate-200/90 px-3 py-1.5 text-left text-xs leading-5 text-slate-600 shadow-[0_12px_26px_rgba(148,163,184,0.18)] backdrop-blur-md',
          isMobile ? 'mr-0 max-w-full' : 'mr-[3.75rem] max-w-[calc(100%-3.75rem)]',
        )}
        >
          {t('chat.aiDisclaimer', { ns: 'share' })}
        </div>
      )}
      questionIcon={
        initUserVariables?.avatar_url
          ? (
              <Avatar
                avatar={initUserVariables.avatar_url}
                name={initUserVariables.name || 'user'}
                size="xl"
              />
            )
          : undefined
      }
    />
  )
}

export default ChatWrapper
