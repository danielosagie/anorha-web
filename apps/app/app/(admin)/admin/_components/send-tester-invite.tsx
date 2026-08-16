'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/design-system/components/ui/alert-dialog';
import { Send } from 'lucide-react';
import { sendTesterInviteAction } from '../actions';

function sendLabel(status: string): string {
  if (status === 'invite_sending') {
    return 'Sending';
  }
  if (status === 'invite_sent') {
    return 'Sent';
  }
  return 'Send invite';
}

export function SendTesterInvite({
  email,
  requestId,
  returnTo,
  status,
}: {
  email: string;
  requestId: string;
  returnTo: string;
  status: string;
}) {
  const canSend = status === 'tester_added';

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="admin-button admin-button-primary"
          disabled={!canSend}
          type="button"
        >
          <Send aria-hidden="true" />
          {sendLabel(status)}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="admin-send-dialog">
        <AlertDialogHeader className="admin-send-dialog-header">
          <AlertDialogTitle>Send invite</AlertDialogTitle>
          <AlertDialogDescription>
            Send the Android tester invite to <strong>{email}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={sendTesterInviteAction}>
          <input name="id" type="hidden" value={requestId} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <AlertDialogFooter className="admin-send-dialog-actions">
            <AlertDialogCancel className="admin-button admin-button-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="admin-button admin-button-primary"
              type="submit"
            >
              Send invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
