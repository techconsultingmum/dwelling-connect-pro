-- Fix: Messages UPDATE policy allows receivers to modify all fields
-- Replace with policy that only allows updating is_read field

DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;

CREATE POLICY "Users can mark received messages as read"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (
  -- Only allow changing is_read to true, all other fields must remain unchanged
  is_read = true
);

-- Add: Allow users to delete their own sent messages for privacy
CREATE POLICY "Users can delete their own sent messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);