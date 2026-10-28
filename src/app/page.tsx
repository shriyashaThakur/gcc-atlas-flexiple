import { Dashboard } from "@/components/Dashboard";
import { gccData } from "@/lib/data";

export default function Home() {
  return <Dashboard data={gccData} />;
}
