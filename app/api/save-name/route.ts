import { NextRequest, NextResponse } from 'next/server'

// In-memory store for name-IP mapping
// In production, this will be replaced with Convex
const nameStore = new Map<string, string>()

function getClientIP(request: NextRequest): string {
  // Check various headers that Vercel/proxies might set
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback (shouldn't happen in Vercel, but good to have)
  return request.ip || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (name.length > 6) {
      return NextResponse.json(
        { error: 'Name must be 6 characters or less' },
        { status: 400 }
      )
    }

    const clientIP = getClientIP(request)
    
    // Store the name associated with the IP
    nameStore.set(clientIP, name)

    return NextResponse.json({
      success: true,
      name,
      ip: clientIP,
    })
  } catch (error) {
    console.error('Error saving name:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const savedName = nameStore.get(clientIP)

    return NextResponse.json({
      name: savedName || null,
      ip: clientIP,
    })
  } catch (error) {
    console.error('Error getting name:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
