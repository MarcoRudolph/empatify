"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface LanguagePickerProps {
  locale: string
}

const languages = [
  {
    code: "de",
    name: "Deutsch",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
        <path fill="#ffcd05" d="M0 27a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4v-4H0z"/>
        <path fill="#ed1f24" d="M0 14h36v9H0z"/>
        <path fill="#141414" d="M32 5H4a4 4 0 0 0-4 4v5h36V9a4 4 0 0 0-4-4"/>
      </svg>
    ),
  },
  {
    code: "en",
    name: "English",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
        <path fill="#eee" d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4"/>
        <path fill="#ce1124" d="M21 5h-6v10H0v6h15v10h6V21h15v-6H21z"/>
      </svg>
    ),
  },
  {
    code: "es",
    name: "Español",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512">
        <path fill="#ffb636" d="M1.793 161.987v186.402c169.54 52.36 339.079-52.36 508.619 0V161.987c-169.54-52.36-339.079 52.359-508.619 0"/>
        <path fill="#e8e8e8" d="M171.242 289.342h-36.121v-41.325h30.361a5.76 5.76 0 0 1 5.76 5.76z"/>
        <path fill="#e2a042" d="M172.313 220.667h-31.481c.948-2.526 1.518-5.688 1.518-9.131c0-8.248-3.237-14.934-7.229-14.934s-7.229 6.686-7.229 14.934c0 3.443.57 6.605 1.518 9.131H97.959c-2.445 0-4.177 2.389-3.416 4.713l3.651 11.157a3.595 3.595 0 0 0 3.398 2.477l67.015.334a3.59 3.59 0 0 0 3.44-2.496l3.688-11.491c.745-2.321-.985-4.694-3.422-4.694"/>
        <path fill="#e8e8e8" d="M87.304 281.017a9.304 9.304 0 1 0-18.608 0c0 3.705 2.171 6.894 5.304 8.391v31.509c0 .787.638 1.425 1.425 1.425h5.15c.787 0 1.425-.638 1.425-1.425v-31.509c3.134-1.497 5.304-4.686 5.304-8.391m111.667 0a9.304 9.304 0 1 0-18.608 0c0 3.705 2.17 6.894 5.304 8.391v31.509c0 .787.638 1.425 1.425 1.425h5.15c.787 0 1.425-.638 1.425-1.425v-31.509c3.133-1.497 5.304-4.686 5.304-8.391"/>
        <path fill="#ff473e" d="M510.412 94.03v67.957c-169.54-52.36-339.079 52.36-508.619 0v-57.54c0-11.042 10.303-19.16 21.051-16.631c158.611 37.323 317.223-51.454 475.834-9.093c6.924 1.849 11.734 8.14 11.734 15.307M1.793 348.39v67.956c0 7.167 4.81 13.458 11.734 15.307c159.129 42.499 318.258-46.998 477.387-8.724c9.944 2.392 19.499-5.177 19.499-15.405v-59.136c-169.541-52.358-339.08 52.362-508.62.002m133.328-59.048v-41.325h-30.362A5.76 5.76 0 0 0 99 253.776v50.506c0 9.975 8.086 18.06 18.061 18.06s18.06-8.086 18.06-18.06c0 9.975 8.086 18.06 18.061 18.06s18.06-8.086 18.06-18.06v-14.94zm6.559-67.825c-4.372.174-8.745.353-13.117.528v18.481c4.372-.153 8.745-.312 13.117-.464zm-35.013 19.599a941 941 0 0 0 13.117-.303v-18.44c-4.372.154-8.745.289-13.117.38zm56.909-20.308c-4.372.092-8.745.227-13.117.381v18.586q6.559-.199 13.117-.304z"/>
        <path fill="#e2a042" d="M127.793 289.342h7.328v14.94c0 5.949-2.89 11.211-7.328 14.501zm-21.465 29.441v-29.441H99v14.94c0 5.949 2.89 11.21 7.328 14.501m14.397-29.441h-7.328v32.627a18.1 18.1 0 0 0 7.328 0z"/>
        <path fill="#575a5b" d="M147.459 289.342c0 6.814-5.524 12.338-12.338 12.338s-12.338-5.524-12.338-12.338s5.524-12.338 12.338-12.338s12.338 5.524 12.338 12.338m-60.155 35.089v-3.086a4.65 4.65 0 0 0-4.649-4.649h-9.31a4.65 4.65 0 0 0-4.649 4.649v3.086a4.65 4.65 0 0 0 4.649 4.649h9.31a4.65 4.65 0 0 0 4.649-4.649m111.667 0v-3.086a4.65 4.65 0 0 0-4.649-4.649h-9.31a4.65 4.65 0 0 0-4.649 4.649v3.086a4.65 4.65 0 0 0 4.649 4.649h9.31a4.65 4.65 0 0 0 4.649-4.649"/>
      </svg>
    ),
  },
  {
    code: "fr",
    name: "Français",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
        <path fill="#ed2939" d="M36 27a4 4 0 0 1-4 4h-8V5h8a4 4 0 0 1 4 4z"/>
        <path fill="#002495" d="M4 5a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h8V5z"/>
        <path fill="#eee" d="M12 5h12v26H12z"/>
      </svg>
    ),
  },
  {
    code: "pt",
    name: "Português",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
        <path fill="#060" d="M36 27a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4z"/>
        <path fill="#d52b1e" d="M32 5H15v26h17a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4"/>
        <path fill="#ffcc4d" d="M15 10a8 8 0 0 0-8 8a8 8 0 1 0 16 0a8 8 0 0 0-8-8m-6.113 4.594l1.602 1.602l-2.46 1.23a6.95 6.95 0 0 1 .858-2.832m-.858 3.979l4.4 2.207l-2.706 1.804l.014.021a6.96 6.96 0 0 1-1.708-4.032M14 24.92a6.95 6.95 0 0 1-2.592-.92H14zM14 23h-3.099L14 20.934zm0-3.268l-.607.405L9.118 18l2.116-1.058L14 19.707zm0-1.439l-3.543-3.543l3.543.59zm0-3.992l-4.432-.713A6.98 6.98 0 0 1 14 11.08zm7.113.293a6.95 6.95 0 0 1 .858 2.833l-2.46-1.23zM16 11.08a7 7 0 0 1 4.432 2.508L16 14.301zm0 4.26l3.543-.591L16 18.293zm0 4.367l2.765-2.765L20.882 18l-4.274 2.137l-.608-.405zm0 5.213V24h2.592a6.95 6.95 0 0 1-2.592.92M16 23v-2.066L19.099 23zm4.264-.395l.014-.021l-2.706-1.804l4.4-2.207a6.98 6.98 0 0 1-1.708 4.032"/>
        <path fill="#d52b1e" d="M11 13v7a4 4 0 0 0 8 0v-7z"/>
        <path fill="#fff" d="M12 14v6a3 3 0 0 0 6 0v-6z"/>
        <path fill="#829acd" d="M13 17h4v2h-4z"/>
        <path fill="#829acd" d="M14 16h2v4h-2z"/>
        <path fill="#039" d="M12 17h1v2h-1zm2 0h2v2h-2zm3 0h1v2h-1zm-3 3h2v2h-2zm0-6h2v2h-2z"/>
      </svg>
    ),
  },
]

// Globe Icon
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 21q-1.858 0-3.5-.71q-1.642-.711-2.86-1.93T3.71 15.5T3 12q0-1.864.71-3.503q.711-1.64 1.93-2.857T8.5 3.71Q10.142 3 12 3q1.864 0 3.503.71q1.64.711 2.858 1.93t1.929 2.857Q21 10.137 21 12q0 1.858-.71 3.5q-.711 1.642-1.93 2.86t-2.857 1.93T12 21m0-.992q.88-1.131 1.452-2.221q.571-1.09.929-2.44H9.619q.397 1.426.948 2.516q.552 1.09 1.433 2.145m-1.273-.15q-.7-.825-1.278-2.04q-.578-1.214-.86-2.472H4.754q.86 1.865 2.437 3.06q1.578 1.194 3.536 1.452m2.546 0q1.958-.258 3.536-1.452q1.577-1.195 2.437-3.06h-3.834q-.38 1.277-.957 2.491q-.578 1.215-1.182 2.02m-8.927-5.51h4.035q-.114-.616-.16-1.2q-.048-.583-.048-1.147t.047-1.147t.16-1.2H4.347q-.163.52-.255 1.133Q4 11.398 4 12t.091 1.215t.255 1.131m5.035 0h5.238q.114-.615.16-1.18q.048-.564.048-1.166t-.047-1.166t-.16-1.18H9.38q-.113.615-.16 1.18q-.047.564-.047 1.166t.047 1.166t.16 1.18m6.24 0h4.034q.163-.519.255-1.131Q20 12.602 20 12t-.091-1.215t-.255-1.131h-4.035q.114.615.16 1.199q.048.584.048 1.147t-.047 1.147t-.16 1.2m-.208-5.693h3.834q-.879-1.904-2.408-3.06t-3.565-1.471q.7.921 1.259 2.107q.559 1.185.88 2.424m-5.793 0h4.762q-.396-1.408-.977-2.546T12 3.992q-.823.977-1.404 2.116T9.62 8.654m-4.865 0h3.834q.321-1.238.88-2.424t1.259-2.107q-2.054.316-3.574 1.48q-1.52 1.166-2.4 3.05"/>
  </svg>
)

export function LanguagePicker({ locale }: LanguagePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Get current language
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false)
    
    // Set locale cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    
    // Handle paths with and without locale prefix
    let newPath: string
    
    // Check if pathname starts with a locale (e.g., /de, /en, etc.)
    const startsWithLocale = languages.some(lang => pathname.startsWith(`/${lang.code}`))
    
    if (startsWithLocale) {
      // Replace the locale in the pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '')
      newPath = `/${newLocale}${pathWithoutLocale}`
    } else {
      // Path doesn't have locale (e.g., /lobby/[id])
      // Just refresh to apply the new locale cookie
      router.refresh()
      return
    }
    
    // Navigate to new path
    router.push(newPath)
    router.refresh()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Globe Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GlobeIcon />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-100 border border-neutral-300 rounded-lg shadow-lg z-50 overflow-hidden">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-neutral-900 hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none transition-colors duration-200 text-left",
                locale === language.code && "bg-neutral-200"
              )}
            >
              <div className="shrink-0">{language.flag}</div>
              <span className="text-sm font-medium">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
