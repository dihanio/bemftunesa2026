import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleInvalid(e: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement>) {
  (e.target as HTMLInputElement | HTMLTextAreaElement).setCustomValidity("Mohon isi bidang ini.");
}

export function handleInput(e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) {
  (e.target as HTMLInputElement | HTMLTextAreaElement).setCustomValidity("");
}
