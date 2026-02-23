"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateProjectDialogProps = {
  action: (formData: FormData) => void;
};

export function CreateProjectDialog({ action }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form
          action={action}
          className="space-y-4"
          onSubmit={() => setOpen(false)}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input id="title" name="title" required placeholder="Deck refresh" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="goal">
              Goal
            </label>
            <Textarea
              id="goal"
              name="goal"
              required
              placeholder="What outcome should this pitch drive?"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="audience">
              Audience
            </label>
            <Input
              id="audience"
              name="audience"
              required
              placeholder="Seed investors, internal review, etc."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="durationSec">
              Target duration (seconds)
            </label>
            <Input
              id="durationSec"
              name="durationSec"
              type="number"
              min={30}
              defaultValue={180}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Save project
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
