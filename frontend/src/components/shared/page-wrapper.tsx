import { ReactNode } from "react"

interface PageWrapperProps {
  children: ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <div className="flex-1 space-y-4 p-4 pt-6">{children}</div>
}
