"use client";

import { useState } from "react";
import { usePublishing } from "@/context/PublishingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function CreatePaperDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { createPaper } = usePublishing();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await createPaper(title);
    setIsSubmitting(false);
    setTitle("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <Plus size={16} /> New Paper
          </Button>
        }
      />
      <DialogContent className="bg-[#111] border-[#333] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Paper</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-[#aaa]">
              Paper Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quantum Supremacy in 2026..."
              className="bg-[#0a0a0a] border-[#333] text-white focus-visible:ring-orange-500"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[#333] text-[#aaa] hover:text-white hover:bg-[#222]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white min-w-[80px]"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
