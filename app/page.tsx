import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Search, FileText, Zap, Target, Lock } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="hero-gradient text-white pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            AI가 만든 가짜 이미지,
            <br />
            AEGIS로 판별하세요
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-4xl mx-auto">
            딥러닝 기반 워터마킹 기술로 보이지 않는 위협까지 탐지하고,
            <br />
            콘텐츠의 무결성을 증명합니다.
          </p>

          <Link href="/protect">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 py-4 text-lg">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">AEGIS가 제공하는 독보적인 기술</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              최첨단 AI 기술로 디지털 콘텐츠의 진위를 보장합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Shield className="h-16 w-16 text-accent mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">디지털 원본 보호</h3>
                <p className="text-gray-600">
                  보이지 않는 워터마크를 삽입하여 당신의 콘텐츠 소유권을 증명하고 원본을 안전하게 보호합니다.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Search className="h-16 w-16 text-accent mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">AI 위변조 검증</h3>
                <p className="text-gray-600">
                  단 몇 초 만에 이미지의 위변조 여부를 판별하고, 조작된 영역을 정확하게 시각화하여 보여줍니다.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <FileText className="h-16 w-16 text-accent mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">법적 증거 활용</h3>
                <p className="text-gray-600">
                  객관적인 분석 리포트를 제공하여 법적 분쟁 시 신뢰할 수 있는 증거 자료로 활용할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Advantages Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">기술적 우위</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">업계 최고 수준의 정확도와 신뢰성을 자랑합니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Zero-shot 대응</h3>
              <p className="text-gray-600">신종 AI 변조 기술 즉시 대응</p>
            </div>

            <div className="text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">95% 이상 정밀도</h3>
              <p className="text-gray-600">95% 이상의 정밀도로 변조 위치 특정</p>
            </div>

            <div className="text-center">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">강인한 워터마크</h3>
              <p className="text-gray-600">압축, 왜곡에도 강력한 워터마크 생존력</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
