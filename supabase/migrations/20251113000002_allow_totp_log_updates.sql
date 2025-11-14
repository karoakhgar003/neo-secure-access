-- Allow updates to totp_issuance_log for users and admins
-- This is needed so the confirm-totp-login function can update the outcome

-- Users can update their own logs (needed for Edge Functions)
CREATE POLICY "Users can update their own logs"
ON public.totp_issuance_log
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can update all logs
CREATE POLICY "Admins can update all logs"
ON public.totp_issuance_log
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
