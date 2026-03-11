CREATE POLICY "Users can update own pending/approved requests"
ON public.absence_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);