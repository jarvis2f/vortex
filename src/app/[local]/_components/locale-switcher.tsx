"use client";
import { useLocale, useTranslations } from "use-intl";
import { locales } from "~/lib/constants";
import { usePathname, useRouter } from "~/navigation";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/lib/ui/dropdown-menu";
import { Button } from "~/lib/ui/button";
import { LanguagesIcon } from "lucide-react";

export default function LocaleSwitcher() {
  const t = useTranslations("global_locale-switcher");
  const locale = useLocale();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  function handleLocaleChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <LanguagesIcon className="h-4 w-4" />
          <span className="sr-only">Toggle local</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={locale === option}
            onCheckedChange={() => handleLocaleChange(option)}
            disabled={isPending}
            className="cursor-pointer"
          >
            {t("locale", { locale: option })}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
