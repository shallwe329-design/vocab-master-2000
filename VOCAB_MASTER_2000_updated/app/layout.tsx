import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "VOCAB MASTER 2000",
  description: "나만의 단어와 숙어로 만드는 맞춤형 영어 학습"
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
