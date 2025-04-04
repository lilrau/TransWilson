"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Selecione uma opção",
  disabled = false,
}: SelectProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger
        className={cn(
          "flex items-center justify-between w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        {value || placeholder}
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Content
        className="z-50 mt-2 w-full rounded-md border bg-white shadow-md"
      >
        {options.length > 0 ? (
          options.map((option) => (
            <DropdownMenuPrimitive.Item
              key={option}
              onClick={() => onChange(option)}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </DropdownMenuPrimitive.Item>
          ))
        ) : (
          <DropdownMenuPrimitive.Item
            disabled
            className="cursor-not-allowed px-3 py-2 text-sm text-gray-400"
          >
            Nenhuma opção disponível
          </DropdownMenuPrimitive.Item>
        )}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  );
}