import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { buttonVariants, Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import {
  BellIcon,
  Settings,
  User,
  CreditCard,
  LogOut,
  Menu,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mobile Navigation Component
function MobileNav({ nav }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'block h-8 w-8 md:hidden'
          )}
        >
          <div className="relative flex items-center justify-center">
            <div className="relative h-4 w-4">
              <span
                className={cn(
                  'bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-100',
                  open ? 'top-[0.4rem] -rotate-45' : 'top-1'
                )}
              />
              <span
                className={cn(
                  'bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-100',
                  open ? 'top-[0.4rem] rotate-45' : 'top-2.5'
                )}
              />
            </div>
            <span className="sr-only">Toggle Menu</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="h-[calc(100vh-80px)] w-screen overflow-y-auto rounded-none border-none bg-background/95 p-0 shadow-none backdrop-blur"
        align="start"
        side="bottom"
        alignOffset={-16}
        sideOffset={4}
      >
        <div className="flex flex-col gap-8 px-6 py-6">
          {nav.map((category, index) => (
            <div className="flex flex-col gap-4" key={index}>
              <p className="text-sm font-medium text-muted-foreground">
                {category.name}
              </p>
              <div className="flex flex-col gap-3">
                {category.items.map((item, idx) => (
                  item.external ? (
                    <a
                      key={idx}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl font-medium hover:text-primary transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={idx}
                      to={item.href}
                      className="text-2xl font-medium hover:text-primary transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// User Profile Dropdown
function UserProfileDropdown({ align = "end", sizeClass = "h-8 w-8" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (!user) return null;

  const userInitials = user.username ? user.username.substring(0, 2).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            sizeClass
          )}
          aria-label="Open user menu"
        >
          <Avatar className={cn("h-full w-full")}>
            <AvatarImage src="/avatar-1.png" alt="User avatar" />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/cards" className="flex items-center cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Cards</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Main Navbar Component
const navigationLinks = [
  {
    name: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/cards", label: "Cards" },
      { href: "/statements", label: "Statements" },
      { href: "/loans", label: "Loans" },
      { href: "/fixed-deposits", label: "Fixed Deposits" },
      { href: "https://www.tradingview.com/", label: "Stocks", external: true },
      { href: "/profile", label: "Settings" },
    ],
  },
];

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path) => location.pathname === path;

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex flex-1 items-center justify-start gap-4">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className="hidden text-xl font-bold sm:inline-block">Nyord</span>
            </Link>

            {user && <MobileNav nav={navigationLinks} />}
          </div>

          <div className="flex items-center justify-end gap-4">
            {user ? (
              <>
                <Link
                  to="/help"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "hidden h-8 w-8 sm:flex"
                  )}
                >
                  <BellIcon className="h-4 w-4" />
                </Link>

                <Separator
                  orientation="vertical"
                  className="hidden h-5 sm:flex"
                />

                <UserProfileDropdown align="end" sizeClass="h-8 w-8" />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 px-4"
                  )}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-9 px-4"
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {user && (
          <div className="hidden w-full items-center justify-start pb-2 md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationLinks[0].items.map((link, index) => (
                  <NavigationMenuItem key={index} asChild>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex flex-col gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all outline-none",
                          "text-foreground/60 hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className={cn(
                          "flex flex-col gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all outline-none",
                          isActive(link.href)
                            ? "text-foreground bg-accent"
                            : "text-foreground/60 hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        )}
      </div>
    </header>
  );
}