"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">개인정보처리방침</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="text-center text-gray-500 py-16">
                <p className="text-lg">개인정보처리방침 내용이 준비 중입니다.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}