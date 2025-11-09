import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SePayWebhookData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }

    // Verify API key if configured
    // SePay sends API key in format: "Authorization": "Apikey YOUR_API_KEY"
    const sepayApiKey = process.env.SEPAY_API_KEY;
    if (sepayApiKey) {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Missing Authorization header' },
          { status: 401 }
        );
      }

      // SePay uses format: "Apikey <api_key>"
      const apikeyPrefix = 'Apikey ';
      if (!authHeader.startsWith(apikeyPrefix)) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Invalid Authorization format. Expected "Apikey <api_key>"' },
          { status: 401 }
        );
      }

      // Extract API key after "Apikey "
      const providedKey = authHeader.substring(apikeyPrefix.length).trim();

      if (!providedKey || providedKey !== sepayApiKey) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Invalid API key' },
          { status: 401 }
        );
      }
    }

    // Get webhook data from request body
    const data: SePayWebhookData = await request.json();

    // Validate required fields
    if (!data || !data.gateway || !data.transactionDate || !data.accountNumber) {
      return NextResponse.json(
        { success: false, message: 'No data or missing required fields' },
        { status: 400 }
      );
    }

    // Extract transaction data
    const {
      gateway,
      transactionDate,
      accountNumber,
      subAccount,
      transferType,
      transferAmount,
      accumulated,
      code,
      content: transactionContent,
      referenceCode,
      description: body,
    } = data;

    // Determine amount_in and amount_out
    const amountIn = transferType === 'in' ? transferAmount : 0;
    const amountOut = transferType === 'out' ? transferAmount : 0;

    // Insert transaction into database
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('tb_transactions')
      .insert({
        gateway,
        transaction_date: transactionDate,
        account_number: accountNumber,
        sub_account: subAccount || null,
        amount_in: amountIn,
        amount_out: amountOut,
        accumulated,
        code,
        transaction_content: transactionContent,
        reference_number: referenceCode,
        body: body || null,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      return NextResponse.json(
        { success: false, message: 'Cannot insert record to database: ' + transactionError.message },
        { status: 500 }
      );
    }

    // Extract order ID from transaction content using regex
    // Pattern: DH{number}, e.g., DH123
    const regex = /DH(\d+)/;
    const matches = transactionContent.match(regex);
    const orderId = matches ? parseInt(matches[1], 10) : null;

    // If no order ID found, return success but log warning
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json(
        { success: false, message: `Order not found. Order_id: ${orderId}` },
        { status: 400 }
      );
    }

    // Find order with matching ID, amount, and unpaid status
    const { data: order, error: orderError } = await supabaseAdmin
      .from('tb_orders')
      .select('*')
      .eq('id', orderId)
      .eq('total', amountIn)
      .eq('payment_status', 'Unpaid')
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: `Order not found. Order_id: ${orderId}` },
        { status: 404 }
      );
    }

    // Update order payment status to Paid
    const { error: updateError } = await supabaseAdmin
      .from('tb_orders')
      .update({ payment_status: 'Paid' })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { success: false, message: 'Cannot update order: ' + updateError.message },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

