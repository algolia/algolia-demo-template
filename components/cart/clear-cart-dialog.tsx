"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ClearCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  onConfirmClear: () => void;
  onCancel: () => void;
}

export function ClearCartDialog({
  open,
  onOpenChange,
  itemCount,
  onConfirmClear,
  onCancel,
}: ClearCartDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Svuotare il carrello?</AlertDialogTitle>
          <AlertDialogDescription>
            Hai {itemCount} {itemCount === 1 ? "articolo" : "articoli"} nel
            carrello. Cambiando negozio o posizione, il carrello verrà svuotato.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Mantieni carrello
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirmClear}>
            Svuota e cambia
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
