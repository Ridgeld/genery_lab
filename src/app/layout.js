import "./globals.css";
import styles from './layout.module.scss'
export const metadata = {
  title: "Genery LAB",
  description: "Made by Genery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <div className={styles.wrapper}>
          <div className={styles.content}>
              {children}
          </div>
        </div>
      </body>
    </html>
  );
}
