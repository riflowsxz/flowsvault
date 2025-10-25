'use client';

import { useState } from 'react';
import { Menu, Home, Upload, FileText, Database, Trash, AlertTriangle, Zap, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/CodeBlock';
import { LanguageProvider, useLanguage } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';

function DocsContent() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const { t } = useLanguage();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://flowsvault.app';

  const sections = [
    { id: 'overview', label: t('docsOverview'), icon: FileText },
    { id: 'authentication', label: t('docsAuthentication'), icon: Database },
    { id: 'upload', label: t('docsUploadFile'), icon: Upload },
    { id: 'download', label: t('docsDownloadFile'), icon: FileText },
    { id: 'list', label: t('docsListFiles'), icon: Database },
    { id: 'delete', label: t('docsDeleteFile'), icon: Trash },
    { id: 'errors', label: t('docsErrorHandling'), icon: AlertTriangle },
    { id: 'rate-limits', label: t('docsRateLimits'), icon: Zap },
  ];

  const getOnThisPageLinks = () => {
    switch (activeSection) {
      case 'overview':
        return [
          { id: 'welcome', label: t('docsWelcomeTitle') },
          { id: 'quickstart', label: t('docsQuickStart') },
          { id: 'baseurl', label: t('docsBaseUrl') },
          { id: 'format', label: t('docsResponseFormat') }
        ];
      case 'upload':
        return [
          { id: 'endpoint', label: t('docsEndpoint') },
          { id: 'request', label: t('docsRequestBody') },
          { id: 'examples', label: t('docsCodeExamples') },
          { id: 'response', label: t('docsSuccessResponse') }
        ];
      default:
        return [];
    }
  };

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="space-y-0.5">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              onItemClick?.();
            }}
            className={`group flex w-full items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className="truncate">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const OnThisPage = () => {
    const links = getOnThisPageLinks();
    if (links.length === 0) return null;

    return (
      <div className="hidden xl:block w-52 shrink-0">
        <div className="sticky top-24 space-y-3">
          <h4 className="text-sm font-semibold">{t('docsOnThisPage')}</h4>
          <nav className="space-y-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1 border-l-2 border-transparent hover:border-primary pl-3"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {showBanner && (
        <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
          <div className="container max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
            <div className="flex items-center justify-between py-2 sm:py-3 gap-2 sm:gap-4">
              <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse shrink-0" />
                <span className="font-medium truncate">Fast & Secure File Storage API</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden md:inline text-primary-foreground/90">Get started in minutes</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary-foreground/20 shrink-0"
                onClick={() => setShowBanner(false)}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container max-w-[1600px] mx-auto flex h-12 sm:h-14 md:h-16 lg:h-[72px] items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-3.5 min-w-0 flex-1">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 hover:opacity-80 transition-opacity min-w-0">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-lg shrink-0">
                <Image src="/android-chrome-192x192.png" alt="FlowsVault" fill className="object-contain" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{t('appName')}</span>
                <span className="hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Docs</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            <LanguageSwitcher />
            <Link href="/">
              <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 hover:bg-primary/10 transition-colors duration-200 rounded-lg border-primary/20 hover:border-primary/40" title="Home">
                <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
              </Button>
            </Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 hover:bg-primary/10 transition-colors duration-200 rounded-lg border-primary/20 hover:border-primary/40">
                  <Menu className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0">
                <div className="p-4 sm:p-6 border-b">
                  <SheetTitle className="text-base sm:text-lg font-bold">{t('docsDocumentation')}</SheetTitle>
                </div>
                <div className="p-3 sm:p-4">
                  <SidebarNav onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container max-w-[1600px] mx-auto flex gap-8 xl:gap-12 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <aside className="hidden lg:block w-52 xl:w-56 shrink-0">
          <div className="sticky top-20 space-y-4 lg:space-y-6">
            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center gap-2 px-3">
                <Database className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold">API Reference</h3>
              </div>
              <SidebarNav />
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-[900px] xl:max-w-none">
          <div className="max-w-none xl:max-w-4xl">
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-3 prose-h2:mt-10 prose-h3:text-xl prose-h3:mt-8 prose-p:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
              
              {activeSection === 'overview' && (
                <div className="space-y-10">
                  <div id="welcome" className="space-y-4">
                    <h1 className="scroll-mt-24">{t('docsWelcomeTitle')}</h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {t('docsWelcomeDesc')}
                    </p>
                  </div>

                  <div id="quickstart" className="space-y-4 sm:space-y-6">
                    <h2 className="scroll-mt-24">{t('docsQuickStart')}</h2>
                    <div className="not-prose grid gap-3 sm:gap-4">
                      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm sm:text-base font-bold shrink-0 shadow-sm">1</div>
                        <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base">{t('docsSignupStep')}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{t('docsSignupDesc')} {baseUrl}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm sm:text-base font-bold shrink-0 shadow-sm">2</div>
                        <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base">{t('docsTokenStep')}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t('docsTokenDesc')}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm sm:text-base font-bold shrink-0 shadow-sm">3</div>
                        <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base">{t('docsUploadStep')}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t('docsUploadStepDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="baseurl" className="space-y-3 sm:space-y-4">
                    <h2 className="scroll-mt-24">{t('docsBaseUrl')}</h2>
                    <div className="not-prose">
                      <div className="p-3 sm:p-4 rounded-lg border bg-muted/50 overflow-x-auto">
                        <code className="text-xs sm:text-sm font-mono text-foreground break-all">{baseUrl}/api</code>
                      </div>
                    </div>
                  </div>

                  <div id="format" className="space-y-3 sm:space-y-4">
                    <h2 className="scroll-mt-24">{t('docsResponseFormat')}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">{t('docsResponseFormatDesc')}</p>
                    <div className="not-prose">
                      <div className="p-3 sm:p-4 rounded-lg border bg-muted/50">
                        <code className="text-xs sm:text-sm font-mono text-foreground">{t('docsApplicationJson')}</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {activeSection === 'authentication' && (
              <div className="space-y-10">
                <div className="space-y-4">
                  <h1>{t('docsAuthentication')}</h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t('docsAuthenticationDesc')}
                  </p>
                </div>

                <div className="space-y-6">
                  <h2>{t('docsApiKeyAuth')}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('docsApiKeyAuthDesc')}
                  </p>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t('docsCreatingApiKey')}</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>{t('docsCreatingApiKeyStep1')} {baseUrl}</li>
                      <li>{t('docsCreatingApiKeyStep2')}</li>
                      <li>{t('docsCreatingApiKeyStep3')}</li>
                      <li>{t('docsCreatingApiKeyStep4')}</li>
                      <li>{t('docsCreatingApiKeyStep5')}</li>
                      <li>{t('docsCreatingApiKeyStep6')}</li>
                    </ol>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t('docsUsingApiKey')}</h3>
                    <p className="text-muted-foreground">
                      {t('docsUsingApiKeyDesc')}
                    </p>
                    <div className="not-prose">
                      <CodeBlock
                        language="bash"
                        code={`curl -X GET '${baseUrl}/api/files' \\
  -H 'Authorization: Bearer your-api-key-here'`}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t('docsManagingApiKeys')}</h3>
                    <p className="text-muted-foreground">
                      {t('docsManagingApiKeysDesc')}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2>{t('docsSessionAuth')}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('docsSessionAuthDesc')}
                  </p>
                  <div className="not-prose">
                    <p className="text-sm font-semibold mb-3">{t('docsExampleCurl')}</p>
                    <CodeBlock
                      language="bash"
                      code={`curl -X GET '${baseUrl}/api/files' \\
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN'`}
                    />
                  </div>
                </div>

                <div className="not-prose">
                  <div className="flex gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 h-fit shrink-0">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div className="space-y-1 sm:space-y-2 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-100">{t('docsSecurityBestPractices')}</h4>
                      <ul className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed list-disc list-inside space-y-1">
                        <li>{t('docsSecurityBestPractice1')}</li>
                        <li>{t('docsSecurityBestPractice2')}</li>
                        <li>{t('docsSecurityBestPractice3')}</li>
                        <li>{t('docsSecurityBestPractice4')}</li>
                        <li>{t('docsSecurityBestPractice5')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'upload' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('docsUploadFile')}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground">{t('docsUploadDesc')}</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight border-b pb-2">{t('docsEndpoint')}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">POST</span>
                    <code className="text-xs sm:text-sm font-mono break-all">/api/upload</code>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('docsRequestBody')}</h3>
                    <div className="rounded-lg border overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-bold whitespace-nowrap">{t('docsParameter')}</th>
                            <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-bold">{t('docsDescription')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
                              <code className="text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono font-semibold">file</code>
                            </td>
                            <td className="py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground text-xs sm:text-sm">{t('docsFileParam')}</td>
                          </tr>
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
                              <code className="text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono font-semibold">expiresIn</code>
                            </td>
                            <td className="py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground text-xs sm:text-sm">{t('docsExpiresParam')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('docsCodeExamples')}</h3>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="overflow-x-auto">
                      <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                      <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                      <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                    </TabsList>
                      <TabsContent value="curl" className="mt-4">
                        <CodeBlock
                          language="bash"
                          code={`curl -X POST '${baseUrl}/api/upload' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  -F 'file=@/path/to/your/file.pdf' \\
  -F 'expiresIn=7d'`}
                        />
                      </TabsContent>
                      <TabsContent value="javascript" className="mt-4">
                        <CodeBlock
                          language="javascript"
                          code={`const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('expiresIn', '7d');

const response = await fetch('${baseUrl}/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key-here'
  },
  body: formData
});

const data = await response.json();`}
                        />
                      </TabsContent>
                      <TabsContent value="python" className="mt-4">
                        <CodeBlock
                          language="python"
                          code={`import requests

files = {'file': open('file.pdf', 'rb')}
data = {'expiresIn': '7d'}
headers = {'Authorization': 'Bearer your-api-key-here'}

response = requests.post('${baseUrl}/api/upload', 
                        files=files, data=data, headers=headers)`}
                        />
                      </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('docsSuccessResponse')}</h3>
                    <CodeBlock
                      language="json"
                      code={`{
  "success": true,
  "data": {
    "id": "file_abc123xyz",
    "fileName": "abc123xyz_file.pdf",
    "originalName": "file.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "downloadUrl": "${baseUrl}/api/download/file_abc123xyz"
  }
}`}
                    />
                </div>
              </div>
            )}

            {activeSection === 'download' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('docsDownloadFile')}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground">{t('docsDownloadDesc')}</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight border-b pb-2">{t('docsEndpoint')}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-blue-100 dark:bg-blue-950 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">GET</span>
                    <code className="text-xs sm:text-sm font-mono break-all">/api/download/:id</code>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('docsCodeExamples')}</h3>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="overflow-x-auto">
                      <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                      <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                      <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CodeBlock
                        language="bash"
                        code={`curl -X GET '${baseUrl}/api/download/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  --output file.pdf`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`const response = await fetch('${baseUrl}/api/download/file_abc123xyz', {
  headers: {
    'Authorization': 'Bearer your-api-key-here'
  }
});
const blob = await response.blob();
// Handle download`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock
                        language="python"
                        code={`import requests

headers = {'Authorization': 'Bearer your-api-key-here'}
response = requests.get('${baseUrl}/api/download/file_abc123xyz', headers=headers)
with open('file.pdf', 'wb') as f:
    f.write(response.content)`}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {activeSection === 'list' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('docsListFiles')}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground">{t('docsListDesc')}</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight border-b pb-2">{t('docsEndpoint')}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-blue-100 dark:bg-blue-950 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">GET</span>
                    <code className="text-xs sm:text-sm font-mono">/api/files</code>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('docsQueryParams')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 sm:px-3 font-semibold whitespace-nowrap">{t('docsParameter')}</th>
                          <th className="text-left py-2 px-2 sm:px-3 font-semibold">{t('docsDescription')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-2 sm:px-3 whitespace-nowrap"><code className="text-xs bg-muted px-1.5 sm:px-2 py-0.5 rounded">page</code></td>
                          <td className="py-2 px-2 sm:px-3 text-muted-foreground text-xs sm:text-sm">{t('docsPageParam')}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2 sm:px-3 whitespace-nowrap"><code className="text-xs bg-muted px-1.5 sm:px-2 py-0.5 rounded">limit</code></td>
                          <td className="py-2 px-2 sm:px-3 text-muted-foreground text-xs sm:text-sm">{t('docsLimitParam')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('docsCodeExamples')}</h3>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="overflow-x-auto">
                      <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                      <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                      <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CodeBlock
                        language="bash"
                        code={`curl -X GET '${baseUrl}/api/files?page=1&limit=10' \\
  -H 'Authorization: Bearer your-api-key-here'`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`const response = await fetch('${baseUrl}/api/files?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer your-api-key-here'
  }
});
const data = await response.json();`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock
                        language="python"
                        code={`import requests

params = {'page': 1, 'limit': 10}
headers = {'Authorization': 'Bearer your-api-key-here'}
response = requests.get('${baseUrl}/api/files', params=params, headers=headers)`}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {activeSection === 'delete' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('docsDeleteFile')}</h1>
                  <p className="text-base sm:text-lg text-muted-foreground">{t('docsDeleteDesc')}</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight border-b pb-2">{t('docsEndpoint')}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-red-100 dark:bg-red-950 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-400">DELETE</span>
                    <code className="text-xs sm:text-sm font-mono break-all">/api/files/:id</code>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('docsCodeExamples')}</h3>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="overflow-x-auto">
                      <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
                      <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                      <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CodeBlock
                        language="bash"
                        code={`curl -X DELETE '${baseUrl}/api/files/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here'`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`const response = await fetch('${baseUrl}/api/files/file_abc123xyz', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer your-api-key-here'
  }
});`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock
                        language="python"
                        code={`import requests

headers = {'Authorization': 'Bearer your-api-key-here'}
response = requests.delete('${baseUrl}/api/files/file_abc123xyz', headers=headers)`}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-3 sm:p-4 rounded-r-md">
                  <h4 className="font-semibold text-sm sm:text-base text-red-900 dark:text-red-100 mb-1.5 sm:mb-2">{t('docsWarning')}</h4>
                  <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{t('docsDeleteWarning')}</p>
                </div>
              </div>
            )}

            {activeSection === 'errors' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight">{t('docsErrorHandling')}</h1>
                  <p className="text-lg text-muted-foreground">{t('docsErrorDesc')}</p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">{t('docsErrorFormat')}</h2>
                  <p className="text-muted-foreground">{t('docsErrorFormatDesc')}</p>
                  <CodeBlock
                    language="json"
                    code={`{
  "success": false,
  "error": "Error message description"
}`}
                  />
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">{t('docsHttpStatusCodes')}</h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border">
                      <span className="rounded bg-green-100 dark:bg-green-950 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-green-700 dark:text-green-400 h-fit shrink-0">200</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">OK</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t('docsStatus200')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border">
                      <span className="rounded bg-yellow-100 dark:bg-yellow-950 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400 h-fit shrink-0">400</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{t('docsStatus400')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t('docsStatus400Desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border">
                      <span className="rounded bg-orange-100 dark:bg-orange-950 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-orange-700 dark:text-orange-400 h-fit shrink-0">401</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{t('docsStatus401')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t('docsStatus401Desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border">
                      <span className="rounded bg-red-100 dark:bg-red-950 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-red-700 dark:text-red-400 h-fit shrink-0">404</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{t('docsStatus404')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t('docsStatus404Desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border">
                      <span className="rounded bg-red-100 dark:bg-red-950 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-red-700 dark:text-red-400 h-fit shrink-0">413</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{t('docsStatus413')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t('docsStatus413Desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border">
                      <span className="rounded bg-purple-100 dark:bg-purple-950 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-purple-700 dark:text-purple-400 h-fit shrink-0">429</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{t('docsStatus429')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t('docsStatus429Desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border">
                      <span className="rounded bg-gray-100 dark:bg-gray-950 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-gray-700 dark:text-gray-400 h-fit shrink-0">500</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{t('docsStatus500')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t('docsStatus500Desc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'rate-limits' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight">{t('docsRateLimits')}</h1>
                  <p className="text-lg text-muted-foreground">{t('docsRateLimitsDesc')}</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">{t('docsCurrentLimits')}</h2>
                  <div className="grid gap-3 sm:gap-4 grid-cols-2">
                    <div className="p-3 sm:p-4 rounded-md border">
                      <h4 className="font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm">{t('docsUploadLimit')}</h4>
                      <p className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">10</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t('docsRequestsPerMin')}</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-md border">
                      <h4 className="font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm">{t('docsDownloadLimit')}</h4>
                      <p className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">50</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t('docsRequestsPerMin')}</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-md border">
                      <h4 className="font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm">{t('docsListLimit')}</h4>
                      <p className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">30</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t('docsRequestsPerMin')}</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-md border">
                      <h4 className="font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm">{t('docsDeleteLimit')}</h4>
                      <p className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">20</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t('docsRequestsPerMin')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">{t('docsRateLimitHeaders')}</h2>
                  <p className="text-muted-foreground">{t('docsRateLimitHeadersDesc')}</p>
                  <CodeBlock
                    language="text"
                    code={`X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1698156000`}
                  />
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-r-md">
                  <h4 className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100 mb-1.5 sm:mb-2">{t('docsBestPractices')}</h4>
                  <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-0.5 sm:space-y-1 list-disc list-inside">
                    <li>{t('docsBestPractice1')}</li>
                    <li>{t('docsBestPractice2')}</li>
                    <li>{t('docsBestPractice3')}</li>
                    <li>{t('docsBestPractice4')}</li>
                  </ul>
                </div>
              </div>
            )}

            </div>
          </div>
        </main>

        <OnThisPage />
      </div>

      <footer className="border-t bg-muted/30 mt-12 sm:mt-16 md:mt-20">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
              {t('docsNeedHelp')}
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('docsHome')}
              </Link>
              <Link href="/docs" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('docsDocumentation')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DocsPage() {
  return (
    <LanguageProvider>
      <DocsContent />
    </LanguageProvider>
  );
}
