'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ImpressumPage() {
  const t = useTranslations('impressum');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-pink-100/80 to-purple-100/80 backdrop-blur-sm border-b border-pink-100/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/#top" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              {t('backToHome')}
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardHeader className="text-center border-b border-gray-100">
              <CardTitle className="text-2xl font-semibold text-gray-800">
                {t('legalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('companyInfo.title')}
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p><strong>{t('companyInfo.name')}:</strong> Marco Rudolph</p>
                    <p><strong>{t('companyInfo.description')}:</strong> Rudolpho-AI. KI-Partner für automatisierte Workflows, authentische Influencer Kampagnen und nutzerzentrierte Web-Erlebnisse.</p>
                    <p><strong>{t('companyInfo.address')}:</strong> No de Halloh 8a, 25591 Ottenbüttel</p>
                    <p><strong>{t('companyInfo.phone')}:</strong> 015116321085</p>
                    <p><strong>{t('companyInfo.email')}:</strong> marcorudolph09@proton.me</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('professional.title')}
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p><strong>{t('professional.profession')}:</strong> Softwareentwickler</p>
                    <p><strong>{t('professional.location')}:</strong> Deutschland</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('insurance.title')}
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p><strong>{t('insurance.insurer')}:</strong> LVM Versicherung, 48126 Münster</p>
                    <p>Telefon: 0251 702-0</p>
                    <p>E-Mail: info@lvm.de</p>
                    <p><strong>{t('insurance.coverage')}:</strong> Deutschland</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('content.title')}
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p>Marco Rudolph</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('dispute.title')}
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      {t('dispute.content')}
                    </p>
                    <p>{t('dispute.emailNote')}</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('consumerDispute.title')}
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>{t('consumerDispute.content')}</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('dsa.title')}
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p>{t('dsa.description')}</p>
                    <p><strong>E-Mail:</strong> marcorudolph09@proton.me</p>
                    <p><strong>Telefon:</strong> 015116321085</p>
                    <p><strong>{t('dsa.languages')}</strong> Deutsch, Englisch.</p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('disclaimer.title')}
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      {t('disclaimer.content')}
                    </p>
                    <p>
                      {t('disclaimer.additional')}
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {t('contact.title')}
                  </h2>
                  <div className="space-y-3 text-gray-600">
                    <p>{t('contact.description')}</p>
                    <p><strong>{t('contact.email')}:</strong> marcorudolph09@proton.me</p>
                    <p><strong>{t('contact.phone')}:</strong> 015116321085</p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 