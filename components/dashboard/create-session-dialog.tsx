"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CreateSessionDialogProps = {
  action: (formData: FormData) => void;
};

export function CreateSessionDialog({ action }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New session</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create session</DialogTitle>
        </DialogHeader>
        <form
          action={action}
          className="space-y-4"
          onSubmit={() => setOpen(false)}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Session title
            </label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Rehearsal 1 - baseline"
            />
          </div>
          <Button type="submit" className="w-full">
            Save session
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
