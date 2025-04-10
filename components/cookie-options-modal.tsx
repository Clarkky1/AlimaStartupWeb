"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface CookieOptionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (options: CookieOptions) => void
}

export interface CookieOptions {
  necessary: boolean
  functional: boolean
  analytics: boolean
  advertising: boolean
}

export function CookieOptionsModal({ open, onOpenChange, onSave }: CookieOptionsModalProps) {
  const [options, setOptions] = useState<CookieOptions>({
    necessary: true, // Always required
    functional: true,
    analytics: true,
    advertising: false,
  })

  const handleSave = () => {
    onSave(options)
    onOpenChange(false)
  }

  const handleAcceptAll = () => {
    const allEnabled = {
      necessary: true,
      functional: true,
      analytics: true,
      advertising: true,
    }
    setOptions(allEnabled)
    onSave(allEnabled)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cookie Settings</DialogTitle>
          <DialogDescription>
            Customize your cookie preferences. Certain cookies are necessary for the website to function properly.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="necessary" className="font-semibold">Necessary Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Required for the website to function properly. Cannot be disabled.
              </p>
            </div>
            <Switch
              id="necessary"
              checked={options.necessary}
              disabled={true}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="functional" className="font-semibold">Functional Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Enhance functionality and personalize your experience (e.g., language preferences).
              </p>
            </div>
            <Switch
              id="functional"
              checked={options.functional}
              onCheckedChange={(checked) => setOptions({ ...options, functional: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics" className="font-semibold">Analytics Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Help us understand how visitors interact with our website.
              </p>
            </div>
            <Switch
              id="analytics"
              checked={options.analytics}
              onCheckedChange={(checked) => setOptions({ ...options, analytics: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="advertising" className="font-semibold">Advertising Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Used to show you relevant ads on other websites and platforms.
              </p>
            </div>
            <Switch
              id="advertising"
              checked={options.advertising}
              onCheckedChange={(checked) => setOptions({ ...options, advertising: checked })}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="sm:w-auto w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="secondary"
            className="sm:w-auto w-full"
            onClick={handleSave}
          >
            Save Preferences
          </Button>
          <Button 
            className="sm:w-auto w-full"
            onClick={handleAcceptAll}
          >
            Accept All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 