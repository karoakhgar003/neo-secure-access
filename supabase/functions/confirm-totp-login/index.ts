import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  orderItemId: string;
  success: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { orderItemId, success } = await req.json() as RequestBody;

    console.log(`[TOTP-CONFIRM] User ${user.id} confirming ${success ? 'success' : 'failure'} for order item ${orderItemId}`);

    // Get the seat
    const { data: seat, error: seatError } = await supabaseClient
      .from('account_seats')
      .select('*')
      .eq('order_item_id', orderItemId)
      .eq('user_id', user.id)
      .single();

    if (seatError || !seat) {
      console.error('[TOTP-CONFIRM] Seat not found:', seatError);
      throw new Error('Seat not found');
    }

    if (success) {
      // Mark as success
      const { error: updateError } = await supabaseClient
        .from('account_seats')
        .update({ status: 'success' })
        .eq('id', seat.id);

      if (updateError) {
        console.error('[TOTP-CONFIRM] Failed to update seat:', updateError);
        throw updateError;
      }

      // Update log
      const { error: logError } = await supabaseClient
        .from('totp_issuance_log')
        .update({ outcome: 'success' })
        .eq('seat_id', seat.id)
        .eq('attempt_number', seat.attempt_count)
        .eq('outcome', 'pending');

      if (logError) {
        console.error('[TOTP-CONFIRM] Failed to update log:', logError);
      }

      console.log(`[TOTP-CONFIRM] Seat ${seat.id} marked as success`);

      return new Response(
        JSON.stringify({ success: true, message: 'Login confirmed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Mark as failure
      const { error: logError } = await supabaseClient
        .from('totp_issuance_log')
        .update({ outcome: 'failure' })
        .eq('seat_id', seat.id)
        .eq('attempt_number', seat.attempt_count)
        .eq('outcome', 'pending');

      if (logError) {
        console.error('[TOTP-CONFIRM] Failed to update log:', logError);
      }

      // If this was the second attempt, lock the seat
      if (seat.attempt_count >= 2) {
        const { error: lockError } = await supabaseClient
          .from('account_seats')
          .update({
            status: 'locked',
            locked_at: new Date().toISOString(),
            lock_reason: 'Failed to login after 2 attempts',
          })
          .eq('id', seat.id);

        if (lockError) {
          console.error('[TOTP-CONFIRM] Failed to lock seat:', lockError);
          throw lockError;
        }

        console.log(`[TOTP-CONFIRM] Seat ${seat.id} locked after 2 failed attempts`);

        return new Response(
          JSON.stringify({
            success: false,
            locked: true,
            message: 'Seat locked. Please contact support.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[TOTP-CONFIRM] Attempt ${seat.attempt_count} marked as failure`);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failure recorded. You have one more attempt.',
          attemptsRemaining: 2 - seat.attempt_count,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[TOTP-CONFIRM] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
