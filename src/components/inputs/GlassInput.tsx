"use client";

interface Props {
  placeholder: string;
  type?: string;
}

export default function GlassInput({
  placeholder,
  type = "text",
}: Props) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="
      w-full
      rounded-2xl
      border
      border-white/10
      bg-white/5
      px-5
      py-4
      text-white
      placeholder:text-gray-400
      backdrop-blur-xl
      outline-none
      transition-all
      duration-300
      focus:border-violet-500
      focus:bg-white/10
      "
    />
  );
}