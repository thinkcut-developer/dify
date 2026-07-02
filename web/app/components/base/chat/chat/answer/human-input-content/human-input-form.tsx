'use client'
import type { HumanInputFormProps } from './type'
import type { ButtonProps } from '@/app/components/base/button'
import type { UserAction } from '@/app/components/workflow/nodes/human-input/types'
import * as React from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/app/components/base/button'
import { cn } from '@/utils/classnames'
import ContentItem from './content-item'
import ExecutedAction from './executed-action'
import { getButtonStyle, initializeInputs, splitByOutputVar } from './utils'

const HumanInputForm = ({
  formData,
  submittedFormData,
  onSubmit,
}: HumanInputFormProps) => {
  const { t } = useTranslation()
  const formToken = formData.form_token
  const defaultInputs = initializeInputs(formData.inputs, formData.resolved_default_values || {})
  const contentList = splitByOutputVar(formData.form_content)
  const [inputs, setInputs] = useState(defaultInputs)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const isSubmitted = !!submittedFormData

  const handleInputsChange = useCallback((name: string, value: string) => {
    if (isSubmitted)
      return
    if (submitError)
      setSubmitError('')
    setInputs(prev => ({
      ...prev,
      [name]: value,
    }))
  }, [isSubmitted, submitError])

  const submit = async (formToken: string, actionID: string, inputs: Record<string, string>) => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit?.(formToken, { inputs, action: actionID })
    }
    catch (error) {
      const fallbackMessage = t('humanInput.invalidOperation', { ns: 'share' })

      if (error && typeof error === 'object' && 'status' in error && 'json' in error && typeof error.json === 'function') {
        try {
          const errorData = await error.json() as { code?: string }
          if (errorData?.code && [
            'human_input_form_expired',
            'human_input_form_submitted',
            'human_input_form_not_found',
            'invalid_action',
          ].includes(errorData.code)) {
            setSubmitError(fallbackMessage)
            return
          }
        }
        catch {
        }
      }

      setSubmitError(fallbackMessage)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {contentList.map((content, index) => (
        <ContentItem
          key={index}
          content={content}
          formInputFields={formData.inputs}
          inputs={inputs}
          readOnly={isSubmitted}
          onInputChange={handleInputsChange}
        />
      ))}
      {submitError && (
        <div
          className={cn(
            'mb-2 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-700',
          )}
          data-testid="human-input-submit-error"
        >
          {submitError}
        </div>
      )}
      {!isSubmitted && (
        <div className="flex flex-wrap gap-1 py-1">
          {formData.actions.map((action: UserAction) => (
            <Button
              key={action.id}
              disabled={isSubmitting}
              variant={getButtonStyle(action.button_style) as ButtonProps['variant']}
              onClick={() => submit(formToken, action.id, inputs)}
              data-testid="action-button"
            >
              {action.title}
            </Button>
          ))}
        </div>
      )}
      {submittedFormData && (
        <ExecutedAction
          executedAction={{
            id: submittedFormData.action_id,
            title: submittedFormData.action_text,
          }}
        />
      )}
    </>
  )
}

export default React.memo(HumanInputForm)
