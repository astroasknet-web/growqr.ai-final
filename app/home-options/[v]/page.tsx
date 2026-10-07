import { notFound } from "next/navigation";
import OptionA from "@/components/home-options/OptionA";
import OptionB from "@/components/home-options/OptionB";
import OptionC from "@/components/home-options/OptionC";
import OptionD from "@/components/home-options/OptionD";
import OptionE from "@/components/home-options/OptionE";
import OptionF from "@/components/home-options/OptionF";

const OPTIONS = { a: OptionA, b: OptionB, c: OptionC, d: OptionD, e: OptionE, f: OptionF } as const;

export function generateStaticParams() {
  return Object.keys(OPTIONS).map((v) => ({ v }));
}

export default async function HomeOption({ params }: { params: Promise<{ v: string }> }) {
  const { v } = await params;
  const Option = OPTIONS[v as keyof typeof OPTIONS];
  if (!Option) notFound();
  return <Option />;
}
