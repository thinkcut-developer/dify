import type { UnsubmittedHumanInputContentProps } from './type'
import ExpirationTime from './expiration-time'
import HumanInputForm from './human-input-form'
import Tips from './tips'

export const UnsubmittedHumanInputContent = ({
  formData,
  submittedFormData,
  showEmailTip = false,
  isEmailDebugMode = false,
  showDebugModeTip = false,
  onSubmit,
}: UnsubmittedHumanInputContentProps) => {
  const { expiration_time } = formData

  return (
    <>
      {/* Form */}
      <HumanInputForm
        formData={formData}
        submittedFormData={submittedFormData}
        onSubmit={onSubmit}
      />
      {/* Tips */}
      {!submittedFormData && (showEmailTip || showDebugModeTip) && (
        <Tips
          showEmailTip={showEmailTip}
          isEmailDebugMode={isEmailDebugMode}
          showDebugModeTip={showDebugModeTip}
        />
      )}
      {/* Expiration Time */}
      {!submittedFormData && typeof expiration_time === 'number' && (
        <ExpirationTime expirationTime={expiration_time * 1000} />
      )}
    </>
  )
}
