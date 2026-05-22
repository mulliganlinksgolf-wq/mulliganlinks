import Image from 'next/image'

export function ProductTile({
  eyebrow,
  title,
  desc,
  imageSrc,
  phone,
}: {
  eyebrow: string
  title: string
  desc: string
  imageSrc: string
  phone?: boolean
}) {
  return (
    <div className="bg-white border border-[#0F3D2E]/10 rounded-xl p-4 flex flex-col gap-3">
      {phone ? (
        <div className="aspect-[9/16] bg-[#082419] rounded-[20px] p-1.5 self-center w-[140px]">
          <Image
            src={imageSrc}
            alt={title}
            width={140}
            height={249}
            className="w-full h-full object-cover object-top rounded-[16px]"
          />
        </div>
      ) : (
        <div className="aspect-[3/2] rounded-md overflow-hidden bg-[#FAF7F2] border border-[#0F3D2E]/8">
          <Image
            src={imageSrc}
            alt={title}
            width={600}
            height={400}
            className="w-full h-full object-cover object-top"
          />
        </div>
      )}
      <div>
        <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-bold">
          {eyebrow}
        </p>
        <p
          className="font-display text-[#0F3D2E] mt-1 leading-[1.1] tracking-[-0.01em]"
          style={{ fontSize: 22, fontWeight: 400 }}
        >
          {title}
        </p>
        <p className="text-[12.5px] text-[#1A1A1A]/72 mt-1 leading-[1.5]">{desc}</p>
      </div>
    </div>
  )
}
