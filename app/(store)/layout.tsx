import Navbar from "./(component)/Navbar";
import Footer from "./(component)/Footer";
import CartDrawer from "./(component)/CartDrawer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen flex flex-col p-2 font-[batica]">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
