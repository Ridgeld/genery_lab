import "./globals.css";
import styles from './layout.module.scss';
import { DM_Sans, Noto_Sans_Mono } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans"
});

const notoMono = Noto_Sans_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-mono"
});

export const metadata = {
  title: "Расчет механизма",
  description: "Made by DM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${dmSans.variable} ${notoMono.variable}`}>
      <body>
        <div className={styles.wrapper}>
          <div className={styles.content}>{children}</div>
        </div>
      </body>
    </html>
  );
}
