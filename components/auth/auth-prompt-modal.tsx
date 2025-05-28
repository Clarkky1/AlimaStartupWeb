"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthPromptModal({
  open,
  onOpenChange,
}: AuthPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/80 dark:bg-black/50 border border-gray-200/50 dark:border-white/5">
        <DialogHeader>
          <DialogTitle className="text-center">Login Required</DialogTitle>
          <DialogDescription className="text-center">
            You need to be logged in to connect with service providers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Don't have an account?
          </p>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 