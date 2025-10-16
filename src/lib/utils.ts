import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function wait(tm : number) : Promise<void> {
  return new Promise<void>((resolve, _reject) => {
    setTimeout(()=>{
      resolve();
    }, tm)
  });
}