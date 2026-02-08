import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const userSession = request.cookies.get('user_session')?.value
    const userRole = request.cookies.get('user_role')?.value

    // 1. ADMIN PROTECTION
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
        if (!user && !userSession) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (userRole !== 'admin') {
            // Strict enforcement: Non-admins go to teacher dashboard or login
            if (userRole === 'teacher') {
                return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
            }
            if (userRole === 'student') {
                return NextResponse.redirect(new URL('/dashboard/student', request.url))
            }
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // 2. TEACHER PROTECTION
    if (request.nextUrl.pathname.startsWith('/dashboard/teacher')) {
        if (!user && !userSession) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Prevent admins or students from staying here if we want absolute separation
        // For convenience, admins might be allowed in teacher areas, but teachers NEVER in admin.
        if (userRole === 'student') {
            return NextResponse.redirect(new URL('/dashboard/student', request.url))
        }
    }

    // 3. STUDENT PROTECTION
    if (request.nextUrl.pathname.startsWith('/dashboard/student')) {
        // Students usually handle session via localStorage, but if cookie exists:
        if (userRole === 'teacher' || userRole === 'admin') {
            const redirectPath = userRole === 'admin' ? '/dashboard/admin' : '/dashboard/teacher';
            return NextResponse.redirect(new URL(redirectPath, request.url))
        }
    }

    // 4. If user is logged in and trying to access login -> Let them be, 
    // or you can redirect to a generic /dashboard which then routes them.
    if (user && request.nextUrl.pathname === '/login') {
        return response
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
