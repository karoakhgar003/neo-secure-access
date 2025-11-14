-- Allow admins to update order items (needed for manual credential assignment)
CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
