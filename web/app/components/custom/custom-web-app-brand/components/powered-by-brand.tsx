import DifyLogo from '@/app/components/base/logo/dify-logo'

type PoweredByBrandProps = {
  webappBrandRemoved?: boolean
  workspaceLogo?: string
  webappLogo?: string
  imgKey: number
}

const PoweredByBrand = ({
  webappBrandRemoved,
  workspaceLogo,
  webappLogo,
  imgKey,
}: PoweredByBrandProps) => {
  if (webappBrandRemoved)
    return null

  const previewLogo = webappLogo ? `${webappLogo}?hash=${imgKey}` : (workspaceLogo || '')

  return (
    <>
      {previewLogo
        ? <img src={previewLogo} alt="logo" className="block h-5 w-auto" />
        : <DifyLogo size="small" />}
      <div className="system-1xs-medium-uppercase text-[8px] text-text-tertiary">POWERED BY</div>
    </>
  )
}

export default PoweredByBrand
