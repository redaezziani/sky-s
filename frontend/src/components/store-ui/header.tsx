import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, User, ShoppingCart, BikeIcon } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full flex flex-col border-b border-border ">
      {/* Promo Accordion */}
      <Accordion type="single" collapsible className="w-full sticky top-0 ">
        <AccordionItem value="item-1" className="w-full">
          <AccordionTrigger className="w-full bg-foreground/90 text-primary/90  rounded-none">
            <div className="flex justify-between items-center w-full px-4 text-sm font-medium">
              <span>Free Shipping on Orders Over $50!</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className=" bg-white text-primary/90 rounded-none ">
            <div className="p-4 text-sm">
              <p className="mb-2">
                Enjoy free shipping on all orders over $50. No code needed!
              </p>
              <p className="mb-2">
                Standard shipping rates apply for orders under $50.
              </p>
              <p>Offer valid for domestic shipping only.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center bg-muted  px-4 py-3 backdrop-blur-sm">
        {/* Logo */}
        <div className="  text-primary">
          <BikeIcon size={28} className="inline-block mr-2" />
          Sky's Bike Shop
        </div>

        {/* Menu Links */}
        <div className="hidden md:flex items-center space-x-6 font-medium">
          <a href="#" className="hover:text-accent transition">
            Home
          </a>
          <a href="#" className="hover:text-accent transition">
            Shop
          </a>
          <a href="#" className="hover:text-accent transition">
            About
          </a>
          <a href="#" className="hover:text-accent transition">
            Contact
          </a>

          {/* Cart & User Links */}
          <a href="/cart" className="relative hover:text-accent transition">
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 text-xs bg-accent text-white rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </a>
          <a href="/auth/login" className="hover:text-accent transition">
            <User size={20} />
          </a>
        </div>

        {/* Mobile Sheet Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Menu size={20} className="md:hidden" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-4">
            <div className="flex flex-col space-y-4 font-medium">
              <a href="#" className="hover:text-accent transition">
                Home
              </a>
              <a href="#" className="hover:text-accent transition">
                Shop
              </a>
              <a href="#" className="hover:text-accent transition">
                About
              </a>
              <a href="#" className="hover:text-accent transition">
                Contact
              </a>
              <a
                href="/cart"
                className="flex items-center space-x-2 hover:text-accent transition"
              >
                <ShoppingCart size={20} />
                <span>Cart</span>
              </a>
              <a
                href="/auth/login"
                className="flex items-center space-x-2 hover:text-accent transition"
              >
                <User size={20} />
                <span>Login</span>
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
