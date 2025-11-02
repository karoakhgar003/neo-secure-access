import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { TOTP } from "https://deno.land/x/otpauth@v9.1.4/dist/otpauth.esm.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  orderItemId: string;
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

    const { orderItemId } = await req.json() as RequestBody;

    console.log(`[TOTP] User ${user.id} requesting TOTP for order item ${orderItemId}`);

    // Get the seat for this order item and user
    const { data: seatRow, error: seatError } = await supabaseClient
      .from('account_seats')
      .select('*')
      .eq('order_item_id', orderItemId)
      .eq('user_id', user.id)
      .single();
    let seat = seatRow;

    if (seatError || !seat) {
      console.error('[TOTP] Seat not found for user/order item, attempting to provision seat:', seatError);

      // Verify the order item belongs to the user
      const { data: orderItem, error: orderItemError } = await supabaseClient
        .from('order_items')
        .select('id, product_id')
        .eq('id', orderItemId)
        .single();

      if (orderItemError || !orderItem) {
        console.error('[TOTP] Order item not found or not accessible:', orderItemError);
        throw new Error('Order item not found or not accessible');
      }

      // Use service role for privileged operations
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Pick an available credential for this product
      const { data: credentialCandidate, error: credSelectError } = await supabaseAdmin
        .from('product_credentials')
        .select('id, max_seats, is_assigned, created_at')
        .eq('product_id', orderItem.product_id)
        .order('is_assigned', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (credSelectError || !credentialCandidate) {
        console.error('[TOTP] No available credentials for product:', credSelectError);
        throw new Error('No credentials available for this product');
      }

      // Check current seat count for the credential
      const { count: currentSeatsCount, error: countError } = await supabaseAdmin
        .from('account_seats')
        .select('*', { count: 'exact', head: true })
        .eq('credential_id', credentialCandidate.id);

      if (countError) {
        console.error('[TOTP] Failed to count seats:', countError);
        throw new Error('Failed to allocate seat');
      }

      if ((currentSeatsCount ?? 0) >= (credentialCandidate.max_seats ?? 1)) {
        console.error('[TOTP] Credential has no available seats');
        throw new Error('No available seats for this product');
      }

      // Create seat
      const { data: createdSeat, error: insertSeatError } = await supabaseAdmin
        .from('account_seats')
        .insert({
          credential_id: credentialCandidate.id,
          order_item_id: orderItemId,
          user_id: user.id
        })
        .select('*')
        .single();

      if (insertSeatError || !createdSeat) {
        console.error('[TOTP] Failed to create seat:', insertSeatError);
        throw new Error('Failed to create seat');
      }

      // If this was the last seat, mark credential as assigned
      if (((currentSeatsCount ?? 0) + 1) >= (credentialCandidate.max_seats ?? 1)) {
        const { error: markAssignedError } = await supabaseAdmin
          .from('product_credentials')
          .update({ is_assigned: true, assigned_at: new Date().toISOString() })
          .eq('id', credentialCandidate.id);

        if (markAssignedError) {
          console.warn('[TOTP] Failed to mark credential as assigned:', markAssignedError);
        }
      }

      seat = createdSeat;
    }

    // Get the credential with TOTP secret using service role (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credential, error: credentialError } = await supabaseAdmin
      .from('product_credentials')
      .select('totp_secret')
      .eq('id', seat.credential_id)
      .single();

    if (credentialError || !credential) {
      console.error('[TOTP] Credential not found:', credentialError);
      throw new Error('Credential not found');
    }

    // Check seat status
    if (seat.status === 'locked') {
      return new Response(
        JSON.stringify({ 
          error: 'Seat is locked. Please contact support.',
          locked: true,
          lock_reason: seat.lock_reason
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (seat.status === 'success') {
      return new Response(
        JSON.stringify({ 
          error: 'You have already successfully logged in.',
          success: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (seat.attempt_count >= 2) {
      return new Response(
        JSON.stringify({ 
          error: 'Maximum attempts reached. Please contact support.',
          locked: true
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: check if 30 seconds have passed since last code
    if (seat.last_code_issued_at) {
      const lastIssued = new Date(seat.last_code_issued_at).getTime();
      const now = Date.now();
      const timeDiff = (now - lastIssued) / 1000;
      
      if (timeDiff < 30) {
        return new Response(
          JSON.stringify({ 
            error: `Please wait ${Math.ceil(30 - timeDiff)} seconds before requesting another code.`,
            waitTime: Math.ceil(30 - timeDiff)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get TOTP secret
    const totpSecret = credential.totp_secret;
    if (!totpSecret) {
      console.error('[TOTP] No TOTP secret found for credential');
      throw new Error('TOTP not configured for this account');
    }

    // Generate TOTP code
    const totp = new TOTP({ secret: totpSecret });
    const code = totp.generate();
    console.log(`[TOTP] Generated code for seat ${seat.id}`);

    // Update seat status
    const newAttemptCount = seat.attempt_count + 1;
    let newStatus = seat.status;
    
    if (seat.status === 'unclaimed') {
      newStatus = 'first_code_issued';
    } else if (seat.status === 'first_code_issued') {
      newStatus = 'second_chance_issued';
    }

    const { error: updateError } = await supabaseClient
      .from('account_seats')
      .update({
        status: newStatus,
        attempt_count: newAttemptCount,
        last_code_issued_at: new Date().toISOString(),
      })
      .eq('id', seat.id);

    if (updateError) {
      console.error('[TOTP] Failed to update seat:', updateError);
      throw updateError;
    }

    // Log the issuance
    const { error: logError } = await supabaseClient
      .from('totp_issuance_log')
      .insert({
        seat_id: seat.id,
        user_id: user.id,
        attempt_number: newAttemptCount,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        outcome: 'pending',
      });

    if (logError) {
      console.error('[TOTP] Failed to log issuance:', logError);
    }

    console.log(`[TOTP] Code issued successfully. Attempt ${newAttemptCount}/2, Status: ${newStatus}`);

    return new Response(
      JSON.stringify({
        code,
        attempt: newAttemptCount,
        isFinalAttempt: newAttemptCount === 2,
        status: newStatus,
        expiresIn: 30,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[TOTP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
