type Props = {
  currentStep: number // 1–5
}

export default function OnboardingProgressBar({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((step) => {
        let segmentClass = ''
        if (step < currentStep) {
          segmentClass = 'bg-[#3B6D11]'
        } else if (step === currentStep) {
          segmentClass = 'bg-[#97C459]'
        } else {
          segmentClass = 'bg-gray-100 border border-gray-200'
        }
        return (
          <div
            key={step}
            className={`h-2 flex-1 rounded-full ${segmentClass}`}
          />
        )
      })}
      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
        Step {currentStep} of 5
      </span>
    </div>
  )
}
