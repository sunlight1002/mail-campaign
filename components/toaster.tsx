"use client"

import { ToastProvider as RadixToastProvider } from "@/components/ui/toast"
import { ToastProvider as CustomToastProvider, useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

function ToastList() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </>
  )
}

export function Toaster() {
  return (
    <RadixToastProvider>
      <CustomToastProvider>
        <ToastList />
      </CustomToastProvider>
    </RadixToastProvider>
  )
}

