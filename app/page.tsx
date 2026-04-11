import Game from "@/app/components/Game";
import { WORD_LIST } from "@/app/lib/words";

export default function Home() {
  return <Game words={WORD_LIST} />;
}
