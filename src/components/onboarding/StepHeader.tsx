type Props = {
  step: number
  title: string
  subtitle: string
}

export default function StepHeader({ step, title, subtitle }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="bg-[#3B6D11] text-white text-sm font-semibold rounded-full flex items-center justify-center w-7 h-7 flex-shrink-0">
          {step}
        </div>
        <span className="text-base font-medium text-gray-900">{title}</span>
      </div>
      <p className="text-sm text-gray-500 mt-0.5 ml-10">{subtitle}</p>
      <hr className="border-t border-gray-200 mt-4" />
    </div>
  )
}
