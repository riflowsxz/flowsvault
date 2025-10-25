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
                      <TabsTrigger value="php" className="text-xs sm:text-sm">PHP</TabsTrigger>
                      <TabsTrigger value="node" className="text-xs sm:text-sm">Node.js</TabsTrigger>
                    </TabsList>
                      <TabsContent value="curl" className="mt-4">
                        <CodeBlock
                          language="bash"
                          code={`# Basic upload
curl -X POST '${baseUrl}/api/upload' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  -F 'file=@/path/to/your/file.pdf' \\
  -F 'expiresIn=7d'

# Upload with expiration time (1 hour)
curl -X POST '${baseUrl}/api/upload' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  -F 'file=@/path/to/your/document.pdf' \\
  -F 'expiresIn=1h'

# Upload without expiration
curl -X POST '${baseUrl}/api/upload' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  -F 'file=@/path/to/your/image.jpg'`}
                        />
                      </TabsContent>
                      <TabsContent value="javascript" className="mt-4">
                        <CodeBlock
                          language="javascript"
                          code={`// Browser upload with error handling
async function uploadFile(file, expiresIn = '7d') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiresIn', expiresIn);

    const response = await fetch('${baseUrl}/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-api-key-here'
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    console.log('File uploaded successfully:', data.data);
    console.log('Download URL:', data.data.downloadUrl);
    
    return data.data;
  } catch (error) {
    console.error('Upload error:', error.message);
    throw error;
  }
}

// Usage
const fileInput = document.querySelector('#fileInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const result = await uploadFile(file, '7d');
    console.log('Uploaded file ID:', result.id);
  }
});`}
                        />
                      </TabsContent>
                      <TabsContent value="python" className="mt-4">
                        <CodeBlock
                          language="python"
                          code={`import requests
import os

def upload_file(file_path, api_key, expires_in='7d'):
    """
    Upload a file to FlowsVault API
    
    Args:
        file_path: Path to the file to upload
        api_key: Your API key
        expires_in: Expiration time (e.g., '1h', '7d', '30d')
    
    Returns:
        dict: Upload response data
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    url = '${baseUrl}/api/upload'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    with open(file_path, 'rb') as f:
        files = {'file': (os.path.basename(file_path), f)}
        data = {'expiresIn': expires_in}
        
        try:
            response = requests.post(url, files=files, data=data, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                print(f"File uploaded successfully!")
                print(f"File ID: {result['data']['id']}")
                print(f"Download URL: {result['data']['downloadUrl']}")
                return result['data']
            else:
                raise Exception(result.get('error', 'Upload failed'))
                
        except requests.exceptions.HTTPError as e:
            error_msg = e.response.json().get('error', str(e))
            raise Exception(f"Upload failed: {error_msg}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")

# Example usage
if __name__ == '__main__':
    api_key = 'your-api-key-here'
    file_path = '/path/to/your/file.pdf'
    
    try:
        result = upload_file(file_path, api_key, expires_in='7d')
        print(f"Success! File can be accessed at: {result['downloadUrl']}")
    except Exception as e:
        print(f"Error: {e}")`}
                        />
                      </TabsContent>
                      <TabsContent value="php" className="mt-4">
                        <CodeBlock
                          language="php"
                          code={`<?php
function uploadFile($filePath, $apiKey, $expiresIn = '7d') {
    if (!file_exists($filePath)) {
        throw new Exception("File not found: $filePath");
    }
    
    $url = '${baseUrl}/api/upload';
    
    $curl = curl_init();
    
    $postFields = [
        'file' => new CURLFile($filePath),
        'expiresIn' => $expiresIn
    ];
    
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey
        ]
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    $data = json_decode($response, true);
    
    if ($httpCode >= 400) {
        $errorMsg = $data['error'] ?? 'Upload failed';
        throw new Exception("Upload failed: $errorMsg");
    }
    
    if ($data['success']) {
        echo "File uploaded successfully!\\n";
        echo "File ID: " . $data['data']['id'] . "\\n";
        echo "Download URL: " . $data['data']['downloadUrl'] . "\\n";
        return $data['data'];
    }
    
    throw new Exception($data['error'] ?? 'Unknown error');
}

// Usage
try {
    $apiKey = 'your-api-key-here';
    $filePath = '/path/to/your/file.pdf';
    
    $result = uploadFile($filePath, $apiKey, '7d');
    echo "Success! File ID: " . $result['id'];
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>`}
                        />
                      </TabsContent>
                      <TabsContent value="node" className="mt-4">
                        <CodeBlock
                          language="javascript"
                          code={`// Node.js upload with axios and form-data
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFile(filePath, apiKey, expiresIn = '7d') {
  if (!fs.existsSync(filePath)) {
    throw new Error(\`File not found: \${filePath}\`);
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('expiresIn', expiresIn);

  try {
    const response = await axios.post('${baseUrl}/api/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': \`Bearer \${apiKey}\`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (response.data.success) {
      console.log('File uploaded successfully!');
      console.log('File ID:', response.data.data.id);
      console.log('Download URL:', response.data.data.downloadUrl);
      return response.data.data;
    }

    throw new Error(response.data.error || 'Upload failed');
  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.error || error.message;
      throw new Error(\`Upload failed: \${errorMsg}\`);
    }
    throw new Error(\`Network error: \${error.message}\`);
  }
}

// Example usage
(async () => {
  try {
    const apiKey = 'your-api-key-here';
    const filePath = '/path/to/your/file.pdf';
    
    const result = await uploadFile(filePath, apiKey, '7d');
    console.log(\`Success! File can be accessed at: \${result.downloadUrl}\`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();`}
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
                      <TabsTrigger value="php" className="text-xs sm:text-sm">PHP</TabsTrigger>
                      <TabsTrigger value="node" className="text-xs sm:text-sm">Node.js</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CodeBlock
                        language="bash"
                        code={`# Download file to specific path
curl -X GET '${baseUrl}/api/download/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  --output file.pdf

# Download with verbose output
curl -X GET '${baseUrl}/api/download/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  --output downloaded_file.pdf \\
  -v

# Download and show progress
curl -X GET '${baseUrl}/api/download/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  --output file.pdf \\
  --progress-bar`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`// Browser download with proper error handling
async function downloadFile(fileId, apiKey) {
  try {
    const response = await fetch(\`${baseUrl}/api/download/\${fileId}\`, {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'downloaded_file';

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('File downloaded successfully:', filename);
  } catch (error) {
    console.error('Download error:', error.message);
    throw error;
  }
}

// Usage
downloadFile('file_abc123xyz', 'your-api-key-here')
  .then(() => console.log('Download complete'))
  .catch(err => console.error('Failed:', err));`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock
                        language="python"
                        code={`import requests
import os
from pathlib import Path

def download_file(file_id, api_key, output_path=None):
    """
    Download a file from FlowsVault API
    
    Args:
        file_id: ID of the file to download
        api_key: Your API key
        output_path: Optional path to save the file
    
    Returns:
        str: Path to the downloaded file
    """
    url = f'${baseUrl}/api/download/{file_id}'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.get(url, headers=headers, stream=True)
        response.raise_for_status()
        
        # Get filename from Content-Disposition header
        content_disposition = response.headers.get('Content-Disposition', '')
        if 'filename=' in content_disposition:
            filename = content_disposition.split('filename=')[1].strip('"')
        else:
            filename = f'{file_id}_downloaded'
        
        # Use provided path or current directory
        if output_path:
            filepath = Path(output_path)
        else:
            filepath = Path(filename)
        
        # Download with progress
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size:
                        percent = (downloaded / total_size) * 100
                        print(f'\\rDownloading: {percent:.1f}%', end='')
        
        print(f'\\nFile downloaded successfully: {filepath}')
        return str(filepath)
        
    except requests.exceptions.HTTPError as e:
        error_msg = 'Unknown error'
        try:
            error_data = e.response.json()
            error_msg = error_data.get('error', str(e))
        except:
            error_msg = str(e)
        raise Exception(f"Download failed: {error_msg}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")

# Example usage
if __name__ == '__main__':
    api_key = 'your-api-key-here'
    file_id = 'file_abc123xyz'
    
    try:
        filepath = download_file(file_id, api_key, 'downloaded_file.pdf')
        print(f"Success! File saved to: {filepath}")
    except Exception as e:
        print(f"Error: {e}")`}
                      />
                    </TabsContent>
                    <TabsContent value="php" className="mt-4">
                      <CodeBlock
                        language="php"
                        code={`<?php
function downloadFile($fileId, $apiKey, $outputPath = null) {
    $url = '${baseUrl}/api/download/' . $fileId;
    
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_HEADERFUNCTION => function($curl, $header) use (&$filename) {
            if (stripos($header, 'Content-Disposition:') !== false) {
                preg_match('/filename="([^"]+)"/', $header, $matches);
                if (isset($matches[1])) {
                    $filename = $matches[1];
                }
            }
            return strlen($header);
        }
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    if ($httpCode >= 400) {
        $errorData = json_decode($response, true);
        $errorMsg = $errorData['error'] ?? 'Download failed';
        throw new Exception("Download failed: $errorMsg");
    }
    
    // Determine output filename
    if ($outputPath) {
        $filepath = $outputPath;
    } elseif (isset($filename)) {
        $filepath = $filename;
    } else {
        $filepath = $fileId . '_downloaded';
    }
    
    // Save file
    $bytesWritten = file_put_contents($filepath, $response);
    
    if ($bytesWritten === false) {
        throw new Exception("Failed to write file: $filepath");
    }
    
    echo "File downloaded successfully: $filepath\\n";
    echo "Size: " . number_format($bytesWritten) . " bytes\\n";
    
    return $filepath;
}

// Usage
try {
    $apiKey = 'your-api-key-here';
    $fileId = 'file_abc123xyz';
    
    $filepath = downloadFile($fileId, $apiKey, 'downloaded_file.pdf');
    echo "Success! File saved to: $filepath";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>`}
                      />
                    </TabsContent>
                    <TabsContent value="node" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`// Node.js download with axios
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadFile(fileId, apiKey, outputPath = null) {
  const url = \`${baseUrl}/api/download/\${fileId}\`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`
      },
      responseType: 'stream'
    });

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = \`\${fileId}_downloaded\`;
    
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition
        .split('filename=')[1]
        .replace(/"/g, '');
    }

    // Use provided path or default filename
    const filepath = outputPath || filename;

    // Create write stream
    const writer = fs.createWriteStream(filepath);

    // Track progress
    const totalLength = response.headers['content-length'];
    let downloadedLength = 0;

    response.data.on('data', (chunk) => {
      downloadedLength += chunk.length;
      if (totalLength) {
        const percent = (downloadedLength / totalLength * 100).toFixed(1);
        process.stdout.write(\`\\rDownloading: \${percent}%\`);
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(\`\\nFile downloaded successfully: \${filepath}\`);
        resolve(filepath);
      });
      writer.on('error', reject);
    });

  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.error || error.message;
      throw new Error(\`Download failed: \${errorMsg}\`);
    }
    throw new Error(\`Network error: \${error.message}\`);
  }
}

// Example usage
(async () => {
  try {
    const apiKey = 'your-api-key-here';
    const fileId = 'file_abc123xyz';
    
    const filepath = await downloadFile(fileId, apiKey, 'downloaded_file.pdf');
    console.log(\`Success! File saved to: \${filepath}\`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();`}
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
                      <TabsTrigger value="php" className="text-xs sm:text-sm">PHP</TabsTrigger>
                      <TabsTrigger value="node" className="text-xs sm:text-sm">Node.js</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CodeBlock
                        language="bash"
                        code={`# List first 10 files
curl -X GET '${baseUrl}/api/files?page=1&limit=10' \\
  -H 'Authorization: Bearer your-api-key-here'

# List with different page size
curl -X GET '${baseUrl}/api/files?page=2&limit=20' \\
  -H 'Authorization: Bearer your-api-key-here'

# Get all files (default pagination)
curl -X GET '${baseUrl}/api/files' \\
  -H 'Authorization: Bearer your-api-key-here'`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`// Browser list files with pagination
async function listFiles(apiKey, page = 1, limit = 10) {
  try {
    const url = new URL('${baseUrl}/api/files');
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);

    const response = await fetch(url, {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list files');
    }

    const data = await response.json();
    
    if (data.success) {
      console.log(\`Total files: \${data.data.total}\`);
      console.log(\`Page \${data.data.page} of \${data.data.totalPages}\`);
      console.log(\`Files on this page: \${data.data.files.length}\`);
      
      data.data.files.forEach((file, index) => {
        console.log(\`\${index + 1}. \${file.originalName} (\${file.size} bytes)\`);
        console.log(\`   ID: \${file.id}\`);
        console.log(\`   Download: \${file.downloadUrl}\`);
      });
      
      return data.data;
    }
    
    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('List files error:', error.message);
    throw error;
  }
}

// Usage - Get all pages
async function getAllFiles(apiKey) {
  let allFiles = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const result = await listFiles(apiKey, page, 50);
    allFiles = allFiles.concat(result.files);
    hasMore = page < result.totalPages;
    page++;
  }
  
  return allFiles;
}

// Example
listFiles('your-api-key-here', 1, 10)
  .then(data => console.log('Files retrieved:', data.files.length))
  .catch(err => console.error('Failed:', err));`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock
                        language="python"
                        code={`import requests
from typing import List, Dict

def list_files(api_key, page=1, limit=10):
    """
    List files from FlowsVault API with pagination
    
    Args:
        api_key: Your API key
        page: Page number (default: 1)
        limit: Files per page (default: 10)
    
    Returns:
        dict: Files data with pagination info
    """
    url = '${baseUrl}/api/files'
    headers = {'Authorization': f'Bearer {api_key}'}
    params = {'page': page, 'limit': limit}
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('success'):
            result = data['data']
            print(f"Total files: {result['total']}")
            print(f"Page {result['page']} of {result['totalPages']}")
            print(f"Files on this page: {len(result['files'])}")
            print()
            
            for i, file in enumerate(result['files'], 1):
                print(f"{i}. {file['originalName']} ({file['size']} bytes)")
                print(f"   ID: {file['id']}")
                print(f"   Type: {file['mimeType']}")
                print(f"   Download: {file['downloadUrl']}")
                print()
            
            return result
        else:
            raise Exception(data.get('error', 'Failed to list files'))
            
    except requests.exceptions.HTTPError as e:
        error_msg = e.response.json().get('error', str(e))
        raise Exception(f"List files failed: {error_msg}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")

def get_all_files(api_key) -> List[Dict]:
    """Get all files by iterating through all pages"""
    all_files = []
    page = 1
    
    while True:
        result = list_files(api_key, page, 50)
        all_files.extend(result['files'])
        
        if page >= result['totalPages']:
            break
        
        page += 1
    
    return all_files

# Example usage
if __name__ == '__main__':
    api_key = 'your-api-key-here'
    
    try:
        # List first page
        files_data = list_files(api_key, page=1, limit=10)
        print(f"Retrieved {len(files_data['files'])} files")
        
        # Get all files
        # all_files = get_all_files(api_key)
        # print(f"Total files in account: {len(all_files)}")
    except Exception as e:
        print(f"Error: {e}")`}
                      />
                    </TabsContent>
                    <TabsContent value="php" className="mt-4">
                      <CodeBlock
                        language="php"
                        code={`<?php
function listFiles($apiKey, $page = 1, $limit = 10) {
    $url = '${baseUrl}/api/files?' . http_build_query([
        'page' => $page,
        'limit' => $limit
    ]);
    
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey
        ]
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    $data = json_decode($response, true);
    
    if ($httpCode >= 400) {
        $errorMsg = $data['error'] ?? 'List files failed';
        throw new Exception("List files failed: $errorMsg");
    }
    
    if ($data['success']) {
        $result = $data['data'];
        
        echo "Total files: " . $result['total'] . "\\n";
        echo "Page " . $result['page'] . " of " . $result['totalPages'] . "\\n";
        echo "Files on this page: " . count($result['files']) . "\\n\\n";
        
        foreach ($result['files'] as $index => $file) {
            echo ($index + 1) . ". " . $file['originalName'] . " (" . $file['size'] . " bytes)\\n";
            echo "   ID: " . $file['id'] . "\\n";
            echo "   Type: " . $file['mimeType'] . "\\n";
            echo "   Download: " . $file['downloadUrl'] . "\\n\\n";
        }
        
        return $result;
    }
    
    throw new Exception($data['error'] ?? 'Unknown error');
}

function getAllFiles($apiKey) {
    $allFiles = [];
    $page = 1;
    
    do {
        $result = listFiles($apiKey, $page, 50);
        $allFiles = array_merge($allFiles, $result['files']);
        $page++;
    } while ($page <= $result['totalPages']);
    
    return $allFiles;
}

// Usage
try {
    $apiKey = 'your-api-key-here';
    
    // List first page
    $filesData = listFiles($apiKey, 1, 10);
    echo "Retrieved " . count($filesData['files']) . " files";
    
    // Get all files
    // $allFiles = getAllFiles($apiKey);
    // echo "Total files in account: " . count($allFiles);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>`}
                      />
                    </TabsContent>
                    <TabsContent value="node" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`// Node.js list files with axios
const axios = require('axios');

async function listFiles(apiKey, page = 1, limit = 10) {
  try {
    const response = await axios.get('${baseUrl}/api/files', {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`
      },
      params: { page, limit }
    });

    if (response.data.success) {
      const result = response.data.data;
      
      console.log(\`Total files: \${result.total}\`);
      console.log(\`Page \${result.page} of \${result.totalPages}\`);
      console.log(\`Files on this page: \${result.files.length}\`);
      console.log();
      
      result.files.forEach((file, index) => {
        console.log(\`\${index + 1}. \${file.originalName} (\${file.size} bytes)\`);
        console.log(\`   ID: \${file.id}\`);
        console.log(\`   Type: \${file.mimeType}\`);
        console.log(\`   Download: \${file.downloadUrl}\`);
        console.log();
      });
      
      return result;
    }
    
    throw new Error(response.data.error || 'Failed to list files');
  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.error || error.message;
      throw new Error(\`List files failed: \${errorMsg}\`);
    }
    throw new Error(\`Network error: \${error.message}\`);
  }
}

async function getAllFiles(apiKey) {
  const allFiles = [];
  let page = 1;
  let totalPages = 1;
  
  do {
    const result = await listFiles(apiKey, page, 50);
    allFiles.push(...result.files);
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  
  return allFiles;
}

// Example usage
(async () => {
  try {
    const apiKey = 'your-api-key-here';
    
    // List first page
    const filesData = await listFiles(apiKey, 1, 10);
    console.log(\`Retrieved \${filesData.files.length} files\`);
    
    // Get all files
    // const allFiles = await getAllFiles(apiKey);
    // console.log(\`Total files in account: \${allFiles.length}\`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();`}
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
                      <TabsTrigger value="php" className="text-xs sm:text-sm">PHP</TabsTrigger>
                      <TabsTrigger value="node" className="text-xs sm:text-sm">Node.js</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CodeBlock
                        language="bash"
                        code={`# Delete a single file
curl -X DELETE '${baseUrl}/api/files/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here'

# Delete with verbose output
curl -X DELETE '${baseUrl}/api/files/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  -v

# Delete and show response
curl -X DELETE '${baseUrl}/api/files/file_abc123xyz' \\
  -H 'Authorization: Bearer your-api-key-here' \\
  -i`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`// Browser delete with confirmation and error handling
async function deleteFile(fileId, apiKey) {
  try {
    const response = await fetch(\`${baseUrl}/api/files/\${fileId}\`, {
      method: 'DELETE',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('File deleted successfully:', fileId);
      return true;
    }
    
    throw new Error(data.error || 'Unexpected response');
  } catch (error) {
    console.error('Delete error:', error.message);
    throw error;
  }
}

// Delete with user confirmation
async function deleteFileWithConfirmation(fileId, fileName, apiKey) {
  const confirmed = confirm(\`Are you sure you want to delete "\${fileName}"? This action cannot be undone.\`);
  
  if (!confirmed) {
    console.log('Delete cancelled by user');
    return false;
  }
  
  try {
    await deleteFile(fileId, apiKey);
    console.log('File deleted successfully');
    return true;
  } catch (error) {
    alert(\`Failed to delete file: \${error.message}\`);
    return false;
  }
}

// Bulk delete multiple files
async function deleteMultipleFiles(fileIds, apiKey) {
  const results = {
    success: [],
    failed: []
  };
  
  for (const fileId of fileIds) {
    try {
      await deleteFile(fileId, apiKey);
      results.success.push(fileId);
    } catch (error) {
      results.failed.push({ fileId, error: error.message });
    }
  }
  
  console.log(\`Deleted: \${results.success.length}, Failed: \${results.failed.length}\`);
  return results;
}

// Example usage
deleteFile('file_abc123xyz', 'your-api-key-here')
  .then(() => console.log('Delete complete'))
  .catch(err => console.error('Failed:', err));`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock
                        language="python"
                        code={`import requests
from typing import List, Dict

def delete_file(file_id, api_key):
    """
    Delete a file from FlowsVault API
    
    Args:
        file_id: ID of the file to delete
        api_key: Your API key
    
    Returns:
        bool: True if deletion was successful
    """
    url = f'${baseUrl}/api/files/{file_id}'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('success'):
            print(f"File {file_id} deleted successfully")
            return True
        else:
            raise Exception(data.get('error', 'Delete failed'))
            
    except requests.exceptions.HTTPError as e:
        error_msg = 'Unknown error'
        try:
            error_data = e.response.json()
            error_msg = error_data.get('error', str(e))
        except:
            error_msg = str(e)
        raise Exception(f"Delete failed: {error_msg}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")

def delete_file_with_confirmation(file_id, file_name, api_key):
    """Delete file with user confirmation"""
    confirm = input(f'Are you sure you want to delete "{file_name}"? (yes/no): ')
    
    if confirm.lower() != 'yes':
        print('Delete cancelled by user')
        return False
    
    try:
        delete_file(file_id, api_key)
        print('File deleted successfully')
        return True
    except Exception as e:
        print(f"Failed to delete file: {e}")
        return False

def delete_multiple_files(file_ids: List[str], api_key) -> Dict:
    """
    Delete multiple files
    
    Args:
        file_ids: List of file IDs to delete
        api_key: Your API key
    
    Returns:
        dict: Results with success and failed lists
    """
    results = {
        'success': [],
        'failed': []
    }
    
    for file_id in file_ids:
        try:
            delete_file(file_id, api_key)
            results['success'].append(file_id)
        except Exception as e:
            results['failed'].append({
                'file_id': file_id,
                'error': str(e)
            })
    
    print(f"Deleted: {len(results['success'])}, Failed: {len(results['failed'])}")
    return results

# Example usage
if __name__ == '__main__':
    api_key = 'your-api-key-here'
    file_id = 'file_abc123xyz'
    
    try:
        # Single file delete
        delete_file(file_id, api_key)
        print("Delete complete")
        
        # Multiple files delete
        # file_ids = ['file_id1', 'file_id2', 'file_id3']
        # results = delete_multiple_files(file_ids, api_key)
        # print(f"Results: {results}")
    except Exception as e:
        print(f"Error: {e}")`}
                      />
                    </TabsContent>
                    <TabsContent value="php" className="mt-4">
                      <CodeBlock
                        language="php"
                        code={`<?php
function deleteFile($fileId, $apiKey) {
    $url = '${baseUrl}/api/files/' . $fileId;
    
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'DELETE',
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey
        ]
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    if ($error) {
        throw new Exception("cURL error: $error");
    }
    
    $data = json_decode($response, true);
    
    if ($httpCode >= 400) {
        $errorMsg = $data['error'] ?? 'Delete failed';
        throw new Exception("Delete failed: $errorMsg");
    }
    
    if ($data['success']) {
        echo "File $fileId deleted successfully\\n";
        return true;
    }
    
    throw new Exception($data['error'] ?? 'Unknown error');
}

function deleteFileWithConfirmation($fileId, $fileName, $apiKey) {
    echo "Are you sure you want to delete \\"$fileName\\"? (yes/no): ";
    $confirm = trim(fgets(STDIN));
    
    if (strtolower($confirm) !== 'yes') {
        echo "Delete cancelled by user\\n";
        return false;
    }
    
    try {
        deleteFile($fileId, $apiKey);
        echo "File deleted successfully\\n";
        return true;
    } catch (Exception $e) {
        echo "Failed to delete file: " . $e->getMessage() . "\\n";
        return false;
    }
}

function deleteMultipleFiles($fileIds, $apiKey) {
    $results = [
        'success' => [],
        'failed' => []
    ];
    
    foreach ($fileIds as $fileId) {
        try {
            deleteFile($fileId, $apiKey);
            $results['success'][] = $fileId;
        } catch (Exception $e) {
            $results['failed'][] = [
                'file_id' => $fileId,
                'error' => $e->getMessage()
            ];
        }
    }
    
    echo "Deleted: " . count($results['success']) . ", Failed: " . count($results['failed']) . "\\n";
    return $results;
}

// Usage
try {
    $apiKey = 'your-api-key-here';
    $fileId = 'file_abc123xyz';
    
    // Single file delete
    deleteFile($fileId, $apiKey);
    echo "Delete complete";
    
    // Multiple files delete
    // $fileIds = ['file_id1', 'file_id2', 'file_id3'];
    // $results = deleteMultipleFiles($fileIds, $apiKey);
    // print_r($results);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>`}
                      />
                    </TabsContent>
                    <TabsContent value="node" className="mt-4">
                      <CodeBlock
                        language="javascript"
                        code={`// Node.js delete with axios
const axios = require('axios');

async function deleteFile(fileId, apiKey) {
  try {
    const response = await axios.delete(\`${baseUrl}/api/files/\${fileId}\`, {
      headers: {
        'Authorization': \`Bearer \${apiKey}\`
      }
    });

    if (response.data.success) {
      console.log(\`File \${fileId} deleted successfully\`);
      return true;
    }
    
    throw new Error(response.data.error || 'Delete failed');
  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.error || error.message;
      throw new Error(\`Delete failed: \${errorMsg}\`);
    }
    throw new Error(\`Network error: \${error.message}\`);
  }
}

async function deleteFileWithConfirmation(fileId, fileName, apiKey) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(\`Are you sure you want to delete "\${fileName}"? (yes/no): \`, async (answer) => {
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Delete cancelled by user');
        resolve(false);
        return;
      }
      
      try {
        await deleteFile(fileId, apiKey);
        console.log('File deleted successfully');
        resolve(true);
      } catch (error) {
        console.error(\`Failed to delete file: \${error.message}\`);
        resolve(false);
      }
    });
  });
}

async function deleteMultipleFiles(fileIds, apiKey) {
  const results = {
    success: [],
    failed: []
  };
  
  for (const fileId of fileIds) {
    try {
      await deleteFile(fileId, apiKey);
      results.success.push(fileId);
    } catch (error) {
      results.failed.push({
        fileId,
        error: error.message
      });
    }
  }
  
  console.log(\`Deleted: \${results.success.length}, Failed: \${results.failed.length}\`);
  return results;
}

// Example usage
(async () => {
  try {
    const apiKey = 'your-api-key-here';
    const fileId = 'file_abc123xyz';
    
    // Single file delete
    await deleteFile(fileId, apiKey);
    console.log('Delete complete');
    
    // Multiple files delete
    // const fileIds = ['file_id1', 'file_id2', 'file_id3'];
    // const results = await deleteMultipleFiles(fileIds, apiKey);
    // console.log('Results:', results);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();`}
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
