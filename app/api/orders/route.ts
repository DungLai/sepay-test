import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { total } = body;

    // Validate total
    if (!total || isNaN(total) || total <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid total amount' },
        { status: 400 }
      );
    }

    // Create order
    const { data: order, error } = await supabaseAdmin
      .from('tb_orders')
      .insert({
        total: parseFloat(total),
        name: 'Kem Merino',
        payment_status: 'Unpaid',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { success: false, message: 'Cannot insert record to database: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

