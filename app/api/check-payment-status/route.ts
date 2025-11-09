import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { payment_status: 'order_not_found' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { order_id } = body;

    // Validate order_id
    if (!order_id || isNaN(order_id)) {
      return NextResponse.json(
        { payment_status: 'order_not_found' },
        { status: 400 }
      );
    }

    // Get order payment status
    const { data: order, error } = await supabaseAdmin
      .from('tb_orders')
      .select('payment_status')
      .eq('id', parseInt(order_id, 10))
      .single();

    if (error || !order) {
      return NextResponse.json(
        { payment_status: 'order_not_found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      payment_status: order.payment_status,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { payment_status: 'order_not_found' },
      { status: 500 }
    );
  }
}

