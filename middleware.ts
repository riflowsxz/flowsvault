import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimitMultiple } from './lib/rate-limit';

const secret = process.env.NEXTAUTH_SECRET;

const getIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0] || '127.0.0.1';
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  return '127.0.0.1';
};

export async function middleware(request: NextRequest) {
  let uploadRateLimitResult, apiRateLimitResult;
  
  if (request.nextUrl.pathname.startsWith('/api/upload')) {
    const ip = getIP(request);
    const token = await getToken({ req: request, secret });
    
    const checks: Array<{ identifier: string; type: 'uploadPerUser' | 'uploadPerIP' | 'upload' }> = [
      { identifier: `upload_ip_${ip}`, type: 'uploadPerIP' as const },
    ];
    
    if (token?.sub) {
      checks.push({ identifier: `upload_user_${token.sub}`, type: 'uploadPerUser' as const });
      checks.push({ identifier: `upload_${token.sub}_${ip}`, type: 'upload' as const });
    } else {
      checks.push({ identifier: `upload_${ip}`, type: 'upload' as const });
    }
    
    uploadRateLimitResult = await rateLimitMultiple(checks);
    
    if (!uploadRateLimitResult.success) {
      const rateLimitType = token?.sub ? 'per-user or per-IP' : 'per-IP';
      console.log(`Rate limit violation: ${rateLimitType} limit exceeded for IP ${ip}${token?.sub ? ` (user: ${token.sub})` : ''}`);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Too many upload requests. please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.floor((uploadRateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': uploadRateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(uploadRateLimitResult.reset).toISOString()
          }
        }
      );
    }
  }

  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth/')) {
    const ip = getIP(request);
    const token = await getToken({ req: request, secret });
    const checks: Array<{ identifier: string; type: 'apiPerUser' | 'apiPerIP' | 'api' }> = [
      { identifier: `api_ip_${ip}`, type: 'apiPerIP' as const },
    ];
    
    if (token?.sub) {
      checks.push({ identifier: `api_user_${token.sub}`, type: 'apiPerUser' as const });
      checks.push({ identifier: `api_${token.sub}_${ip}`, type: 'api' as const });
    } else {
      checks.push({ identifier: `api_${ip}`, type: 'api' as const });
    }
    
    apiRateLimitResult = await rateLimitMultiple(checks);
    
    if (!apiRateLimitResult.success) {
      const rateLimitType = token?.sub ? 'per-user or per-IP' : 'per-IP';
      console.log(`Rate limit violation: ${rateLimitType} API limit exceeded for IP ${ip}${token?.sub ? ` (user: ${token.sub})` : ''}`);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.floor((apiRateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': apiRateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(apiRateLimitResult.reset).toISOString()
          }
        }
      );
    }
  }
  
  const protectedPaths = [
    '/api/files',
    '/api/download',
  ];

  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !request.nextUrl.pathname.startsWith('/api/upload')) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return NextResponse.next();
    }
    
    const token = await getToken({ req: request, secret });
    
    if (!token) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/api/auth/signin', request.url));
    }
  }

  const response = NextResponse.next();
  
  if (uploadRateLimitResult) {
    response.headers.set('X-RateLimit-Limit', uploadRateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', uploadRateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(uploadRateLimitResult.reset).toISOString());
  } else if (apiRateLimitResult) {
    response.headers.set('X-RateLimit-Limit', apiRateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', apiRateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(apiRateLimitResult.reset).toISOString());
  } else {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Window', '300');
  }
  
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
    {
      source: '/api/:path*',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ]
};