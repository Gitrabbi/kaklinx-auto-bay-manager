import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { fullName, email, password, role, workerId } = await req.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (!['admin', 'cashier', 'worker'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected.' },
        { status: 400 }
      );
    }

    if (role === 'worker' && !workerId) {
      return NextResponse.json(
        { error: 'Please select the worker this login belongs to.' },
        { status: 400 }
      );
    }

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
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
        worker_id: role === 'worker' ? workerId : null,
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
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong while creating user.' },
      { status: 500 }
    );
  }
}
