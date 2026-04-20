// Next.js middleware for Supabase session refresh and auth-based route protection.
// Unauthenticated users are redirected to /auth/login; API and auth routes are exempt.
// Pattern referenced from Supabase SSR docs (@supabase/ssr) and Next.js docs (middleware).
// AI was used to speed up translating those docs into this boilerplate.
// npm install @supabase/ssr


// import { createServerClient } from '@supabase/ssr'
// import { NextResponse, type NextRequest } from 'next/server'

// export async function middleware(request: NextRequest) {
//   let supabaseResponse = NextResponse.next({ request })

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll()
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
//           supabaseResponse = NextResponse.next({ request })
//           cookiesToSet.forEach(({ name, value, options }) =>
//             supabaseResponse.cookies.set(name, value, options)
//           )
//         },
//       },
//     }
//   )

//   const { data: { user } } = await supabase.auth.getUser()

//   const isApiRoute  = request.nextUrl.pathname.startsWith('/api')
//   const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')

//   if (!user && !isApiRoute && !isAuthRoute) {
//     const url = request.nextUrl.clone()
//     url.pathname = '/auth/login'
//     return NextResponse.redirect(url)
//   }

//   return supabaseResponse
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}