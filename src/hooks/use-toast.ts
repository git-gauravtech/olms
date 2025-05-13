// Simplified toast hook using window.alert as ShadCN Toaster is removed.
// In a real application, you might use a lightweight toast library or build a custom one.

type ToastProps = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactElement; // Action element is not easily supportable with window.alert
};

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    let message = title;
    if (description) {
      message += `\n${description}`;
    }
    if (variant === 'destructive') {
      message = `Error: ${message}`;
    }
    window.alert(message);
  };

  // The dismiss function is not applicable for window.alert
  // The toasts array is also not applicable here.
  return { toast, toasts: [], dismiss: () => {} };
}

// Export a standalone toast function for convenience if needed elsewhere without the hook
export const toast = ({ title, description, variant }: ToastProps) => {
  let message = title;
  if (description) {
    message += `\n${description}`;
  }
  if (variant === 'destructive') {
    message = `Error: ${message}`;
  }
  window.alert(message);
};
