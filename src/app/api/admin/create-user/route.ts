import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeGhanaPhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');

  if (cleaned.startsWith('+')) return cleaned;

  if (cleaned.startsWith('0')) {
    return `+233${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('233')) {
    return `+${cleaned}`;
  }

  return cleaned;
}

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, password, role, workerId } =
      await req.json();

    if (!fullName || !phone || !password || !role || !workerId) {
      return NextResponse.json(
        { error: 'Staff, telephone number, password, and role are required.' },
        { status: 400 }
      );
    }

    if (!['admin', 'cashier', 'worker'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeGhanaPhone(phone);

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        phone: normalizedPhone,
        password,
        phone_confirm: true,
        email: email || undefined,
        email_confirm: email ? true : undefined,
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role,
        worker_id: workerId,
        phone: normalizedPhone,
      });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Create user API error:', message);
    return NextResponse.json(
      { error: `Something went wrong while creating user: ${message}` },
      { status: 500 }
    );
  }
}
