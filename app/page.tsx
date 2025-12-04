import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Shield, AlertTriangle, Zap, Target, Lock } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="hero-gradient text-white pt-24 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <p className="text-lg text-gray-200 mb-4">AI 시대, 디지털 신뢰의 새로운 기준</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="hero-text-gradient">
                  AI 편집도 속일 수 없는<br />
                  워터마크 기술,{" "}
                  <Image
                    src="/AEGIS.png"
                    alt="AEGIS"
                    width={188}
                    height={49}
                    className="inline-block"
                  />
                </span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-lg">
                원본의 소유권은 보이지 않게 지켜주고, 조작의 흔적은 명백한 증거로 보여줍니다.
              </p>
            </div>
            <div className="relative">
              <div className="relative z-10 flex justify-center">
                <Image
                  src="/shield.png"
                  alt="AEGIS Shield"
                  width={386}
                  height={386}
                  className="object-contain"
                />
              </div>
              <div className="hero-ellipse absolute bottom-8 left-1/2 transform -translate-x-1/2 w-96 h-32"></div>
            </div>
          </div>
          
          {/* CTA Button - Outside the grid but inside the hero section */}
          <div className="text-center mt-12">
            <Link href="/protect">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 py-4 text-lg">
                무료로 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="pt-16 pb-0 relative" style={{backgroundColor: '#F7F7F7'}}>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">EditGuard 하나면 충분합니다</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              조작 영역을 정밀하게 찾아내고 증거까지 확보하는 단일 워터마킹 솔루션
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="service-card bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-6">
                  <Image
                    src="/target.png"
                    alt="Target"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                  <div className="service-card-editguard text-white px-6 py-3 rounded-full">
                    <span className="text-lg font-bold">EditGuard</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">정밀한 위치 특정 및 증거 확보</h3>
                <p className="text-blue-700 text-lg font-semibold mb-4">어디가 변조되었는지 증명해야 할 때</p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  딥페이크, 허위 정보 등 조작된 영역을 95% 이상 정밀도로 탐지하고 시각적으로 표시합니다.<br />
                  언론 보도, 법적 분쟁 등 조작의 범위와 내용을 명확히 입증해야 할 때 최적의 솔루션입니다.
                </p>
                <div className="space-y-3">
                  <div className="feature-tag inline-block px-4 py-2 text-sm font-semibold mr-2 mb-2">
                    ✓ 95% 위치 탐지 정밀도
                  </div>
                  <div className="feature-tag inline-block px-4 py-2 text-sm font-semibold mr-2 mb-2">
                    ✓ 조작 영역 시각화
                  </div>
                  <div className="feature-tag inline-block px-4 py-2 text-sm font-semibold">
                    ✓ 법정 증거 능력
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>
      {/* Trust Evidence Section */}
      <section className="pt-4 pb-16" style={{backgroundColor: '#F7F7F7'}}>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">신뢰할 수 있는 기술 증거</h3>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 text-center">
                어떤 모델을 선택하든, AEGIS의 검증 결과는 위변조 여부, 원본 소유권 정보가 담긴<br />
                <span className="font-bold" style={{color: '#0B1179'}}>'무결성 검증 보고서'</span>{" "}
                형태로 제공되어, 신뢰도 높은 기술 증거로 활용될 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">결정적인 차이를 만드는 기술력</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AEGIS만의 독보적인 기술력으로 업계 최고 수준의 정확도와 신뢰성을 자랑합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Zero-shot Card */}
            <Card className="tech-card-white rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Image
                  src="/thunder.png"
                  alt="Thunder"
                  width={48}
                  height={48}
                  className="mx-auto mb-6 object-contain"
                />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">신종 AI 공격 즉시 대응</h3>
                <div className="h-8 mb-4 flex items-center justify-center">
                  <span className="text-lg font-bold px-4 py-1" style={{color: '#0B1179'}}>Zero-shot 학습 방식</span>
                </div>
                <p className="text-black leading-relaxed">
                  특정 공격 유형을 학습할 필요 없이, 알려지지 않은 새로운 AI 편집 기술에 즉시 대응 가능
                </p>
              </CardContent>
            </Card>

            {/* Monitoring Card */}
            <Card className="tech-card-blue rounded-lg p-8 text-center hover:shadow-2xl hover:scale-115 transition-all duration-300 text-white transform scale-110">
              <CardContent className="p-0">
                <Image
                  src="/siren.png"
                  alt="Siren"
                  width={48}
                  height={48}
                  className="mx-auto mb-6 object-contain"
                />
                <h3 className="font-bold mb-2" style={{fontSize: '1.48rem'}}>자동화된 불법 유출 및<br />위변조 감시</h3>
                <p className="text-lg font-semibold mb-4" style={{color: '#78BEFD'}}>능동적 모니터링 시스템</p>
                <p className="text-blue-100 leading-relaxed">
                  제3자가 위변조된 이미지 검증 시, 원본 소유자에게 알려져, 내가 모르는 사이에 일어난 위변조 파악 가능
                </p>
              </CardContent>
            </Card>

            {/* Durability Card */}
            <Card className="tech-card-white rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Image
                  src="/lock.png"
                  alt="Lock"
                  width={48}
                  height={48}
                  className="mx-auto mb-6 object-contain"
                />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">딥러닝 기반 강력한 내구성</h3>
                <div className="h-8 mb-4 flex items-center justify-center">
                  <span className="text-lg font-bold px-4 py-1" style={{color: '#0B1179'}}>워터마크 생존력</span>
                </div>
                <p className="text-black leading-relaxed">
                  압축, 왜곡 등 일반적인 이미지 처리 과정에서도 워터마크가 강력하게 유지되어, 콘텐츠의 원본 가치를 안전하게 보호
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
