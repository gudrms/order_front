import * as React from "react"

export interface PolicySection {
  title: string
  body: string[]
}

export interface PolicyPageProps {
  title: string
  effectiveDate?: string
  sections: PolicySection[]
}

/**
 * 이용약관 / 환불정책 등 정적 정책 문서 공용 레이아웃.
 * 본문 데이터는 @order/shared 의 constants/legal 에서 주입한다.
 */
export function PolicyPage({ title, effectiveDate, sections }: PolicyPageProps) {
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {effectiveDate && (
          <p className="text-gray-500 text-sm mb-10">시행일: {effectiveDate}</p>
        )}

        {sections.map((section) => (
          <section key={section.title} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
            <div className="space-y-2">
              {section.body.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
