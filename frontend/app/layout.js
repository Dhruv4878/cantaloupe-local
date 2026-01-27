import "./globals.css";
import { Poppins } from "next/font/google";
import "./installFetchWrapper"; // ensure fetch is wrapped as early as possible on the client
import SuspendedListener from "../components/SuspendedListener";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <SuspendedListener />
        {children}
      </body>
    </html>
  );
}



